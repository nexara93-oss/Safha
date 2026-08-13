import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || auth.user.role !== "DIRECTOR") return err("Forbidden", 403);

    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) return err("Teacher not found", 404);
    if (teacher.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    await prisma.user.delete({ where: { id: teacher.userId } });
    return ok({ success: true });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Not authenticated", 401);

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, status: true } },
      students: {
        include: { user: { select: { id: true, fullName: true } } }
      },
      attendance: { orderBy: { date: "desc" }, take: 30 }
    }
  });
  if (!teacher) return err("Teacher not found", 404);
  if (teacher.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

  if (auth.user.role === "STUDENT") return err("Forbidden", 403);
  if (auth.user.role === "TEACHER") {
    const self = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!self || self.id !== id) return err("Forbidden", 403);
  }

  return ok({ teacher });
}
