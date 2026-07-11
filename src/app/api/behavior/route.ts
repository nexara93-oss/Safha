import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  studentId: z.string(),
  type: z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]),
  note: z.string().min(1).max(1000)
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);

  if (auth.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: auth.user.id } });
    if (!student) return err("Not found", 404);
    const recs = await prisma.behavior.findMany({
      where: { studentId: student.id },
      include: { teacher: { include: { user: { select: { fullName: true } } } } },
      orderBy: { date: "desc" }
    });
    return ok({ behavior: recs });
  }

  if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher) return err("Not found", 404);
    const students = await prisma.student.findMany({ where: { teacherId: teacher.id }, select: { id: true } });
    const recs = await prisma.behavior.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      include: { student: { include: { user: { select: { fullName: true } } } } },
      orderBy: { date: "desc" }
    });
    return ok({ behavior: recs });
  }

  if (auth.user.role === "DIRECTOR" && auth.user.schoolId) {
    const students = await prisma.student.findMany({ where: { schoolId: auth.user.schoolId }, select: { id: true } });
    const recs = await prisma.behavior.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        teacher: { include: { user: { select: { fullName: true } } } }
      },
      orderBy: { date: "desc" },
      take: 200
    });
    return ok({ behavior: recs });
  }

  return ok({ behavior: [] });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return err("Forbidden", 403);
    if (auth.user.role !== "TEACHER") return err("Only teachers can add behavior notes", 403);

    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher) return err("Teacher not found", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422);

    const student = await prisma.student.findUnique({ where: { id: parsed.data.studentId } });
    if (!student) return err("Student not found", 404);
    if (student.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const rec = await prisma.behavior.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        type: parsed.data.type,
        note: parsed.data.note
      }
    });
    return ok({ behavior: rec });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
