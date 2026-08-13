import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);
  if (auth.user.role !== "DIRECTOR") return err("Forbidden", 403);

  const period = await prisma.examPeriod.findUnique({ where: { id } });
  if (!period) return err("Not found", 404);
  if (period.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

  await prisma.examPeriod.delete({ where: { id } });
  return ok({ success: true });
}
