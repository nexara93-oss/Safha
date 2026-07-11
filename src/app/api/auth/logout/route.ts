import { NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function POST(_req: NextRequest) {
  await clearAuthCookie();
  return ok({ success: true });
}
