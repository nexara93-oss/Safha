import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  examId: z.string(),
  studentId: z.string(),
  score: z.number().min(0),
  maxScore: z.number().min(0.1).optional(),
  remarks: z.string().max(1000).nullish()
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  if (!examId) return err("examId query parameter is required", 400);

  const exam = await prisma.finalExam.findUnique({ where: { id: examId } });
  if (!exam || exam.schoolId !== auth.user.schoolId) return err("Not found", 404);

  if (auth.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: auth.user.id } });
    if (!student) return err("Not found", 404);
    const results = await prisma.finalExamResult.findMany({
      where: { examId, studentId: student.id },
      include: { student: { include: { user: { select: { fullName: true } } } } }
    });
    return ok({ results });
  }

  const results = await prisma.finalExamResult.findMany({
    where: { examId },
    include: {
      student: { include: { user: { select: { id: true, fullName: true } } } }
    },
    orderBy: { gradedAt: "desc" }
  });

  return ok({ results });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "TEACHER" && auth.user.role !== "DIRECTOR") return err("Only teachers and directors can grade exams", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const exam = await prisma.finalExam.findUnique({ where: { id: parsed.data.examId } });
    if (!exam) return err("Exam not found", 404);
    if (exam.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const student = await prisma.student.findUnique({ where: { id: parsed.data.studentId } });
    if (!student) return err("Student not found", 404);
    if (student.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const result = await prisma.finalExamResult.upsert({
      where: {
        examId_studentId: { examId: parsed.data.examId, studentId: parsed.data.studentId }
      },
      update: {
        score: parsed.data.score,
        maxScore: parsed.data.maxScore ?? exam.maxScore,
        remarks: parsed.data.remarks ?? null,
        gradedAt: new Date()
      },
      create: {
        examId: exam.id,
        studentId: student.id,
        score: parsed.data.score,
        maxScore: parsed.data.maxScore ?? exam.maxScore,
        remarks: parsed.data.remarks ?? null
      },
      include: { student: { include: { user: { select: { fullName: true } } } } }
    });

    await prisma.notification.create({
      data: {
        userId: student.userId,
        title: "Exam graded",
        message: `Your result for "${exam.name}" (${exam.subject}): ${result.score}/${result.maxScore}`,
        type: "INFO",
        link: `/exams/${exam.id}`
      }
    });

    return ok({ result });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
