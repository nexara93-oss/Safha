import { NextRequest } from "next/server";
import { prisma, hashPassword, generateStrongPassword } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);
  if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER") return err("Forbidden", 403);

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return err("Student not found", 404);
  if (student.schoolId !== auth.user.schoolId) return err("Forbidden", 403);
  if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher || student.teacherId !== teacher.id) return err("Forbidden", 403);
  }

  await prisma.user.delete({ where: { id: student.userId } });
  return ok({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);
  if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER") return err("Forbidden", 403);

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return err("Student not found", 404);
  if (student.schoolId !== auth.user.schoolId) return err("Forbidden", 403);
  if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher || student.teacherId !== teacher.id) return err("Forbidden", 403);
  }

  const body = await req.json().catch(() => ({}));

  if (body.action === "resetPassword") {
    const user = await prisma.user.findUnique({ where: { id: student.userId } });
    if (!user) return err("User not found", 404);

    const newPwd = generateStrongPassword();
    const passwordHash = await hashPassword(newPwd);
    await prisma.user.update({ where: { id: student.userId }, data: { passwordHash } });
    return ok({ email: user.email, password: newPwd });
  }

  return err("Unknown action", 400);
}
