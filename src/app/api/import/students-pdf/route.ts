import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

/**
 * Simple PDF parser for student import. Uses pdf-parse in production.
 * For demo/dev, falls back to a permissive line-based parser that
 * extracts "FirstName LastName" pairs separated by whitespace or commas.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);
  if (auth.user.role !== "TEACHER" && auth.user.role !== "DIRECTOR") return err("Forbidden", 403);

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) return err("No file uploaded", 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";
  try {
    // pdf-parse in production
    const mod = await import("pdf-parse");
    const pdfParse = (mod as unknown as { default: (b: Buffer) => Promise<{ text: string }> }).default;
    const result = await pdfParse(buffer);
    text = result.text;
  } catch {
    // Fallback: try as plain text
    text = buffer.toString("utf-8");
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const students: { firstName: string; lastName: string; serialNumber?: string }[] = [];

  // Heuristic patterns:
  // 1) "1. Youssef Amrani"
  // 2) "1\tYoussef Amrani"
  // 3) "Youssef Amrani"
  const reNumeric = /^(\d+)[\s\.\):\-]+([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s\-]+)$/;

  for (const line of lines) {
    const m = line.match(reNumeric);
    if (m) {
      const [, num, name] = m;
      const parts = name.trim().split(/\s+/);
      const first = parts.shift() || name;
      const last = parts.join(" ");
      students.push({ firstName: first, lastName: last, serialNumber: num });
      continue;
    }
    // Plain two-word name
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts.slice(1).join(" ");
      if (first.length > 1 && last.length > 1) {
        students.push({ firstName: first, lastName: last });
      }
    } else if (parts.length === 1 && parts[0].length > 2) {
      students.push({ firstName: parts[0], lastName: "" });
    }
  }

  // De-dup
  const seen = new Set<string>();
  const unique = students.filter((s) => {
    const key = `${s.firstName.toLowerCase()}|${(s.lastName || "").toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return ok({ students: unique, count: unique.length });
}
