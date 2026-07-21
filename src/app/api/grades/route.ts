import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  studentId: z.string(),
  periodId: z.string(),
  subject: z.string().min(1).max(60),
  score: z.number().min(0),
  maxScore: z.number().min(0.1).default(20)
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);

  if (auth.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: auth.user.id } });
    if (!student) return err("Not found", 404);
    const grades = await prisma.grade.findMany({
      where: { studentId: student.id },
      include: { period: true, teacher: { include: { user: { select: { fullName: true } } } } },
      orderBy: { createdAt: "desc" }
    });
    return ok({ grades }, {
      headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" }
    });
  }

  if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher) return err("Not found", 404);
    const grades = await prisma.grade.findMany({
      where: { teacherId: teacher.id },
      include: { student: { include: { user: { select: { fullName: true } } } }, period: true },
      orderBy: { createdAt: "desc" }
    });
    return ok({ grades });
  }

  if (auth.user.role === "DIRECTOR" && auth.user.schoolId) {
    const students = await prisma.student.findMany({ where: { schoolId: auth.user.schoolId }, select: { id: true } });
    const grades = await prisma.grade.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      include: { student: { include: { user: { select: { fullName: true } } } }, period: true },
      orderBy: { createdAt: "desc" },
      take: 500
    });
    return ok({ grades });
  }

  return err("Forbidden", 403);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return err("Forbidden", 403);
    if (auth.user.role !== "TEACHER") return err("Only teachers can add grades", 403);

    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher) return err("Teacher not found", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const student = await prisma.student.findUnique({ where: { id: parsed.data.studentId } });
    if (!student) return err("Student not found", 404);
    if (student.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const period = await prisma.examPeriod.findUnique({ where: { id: parsed.data.periodId } });
    if (!period) return err("Period not found", 404);
    if (period.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const grade = await prisma.grade.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        periodId: period.id,
        subject: parsed.data.subject,
        score: parsed.data.score,
        maxScore: parsed.data.maxScore
      }
    });
    return ok({ grade });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
