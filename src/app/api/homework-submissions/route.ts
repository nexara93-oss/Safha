import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  homeworkId: z.string(),
  content: z.string().max(5000).nullish(),
  fileUrl: z.string().url().max(500).nullish()
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const homeworkId = searchParams.get("homeworkId");
  if (!homeworkId) return err("homeworkId query parameter is required", 400);

  const homework = await prisma.homework.findUnique({ where: { id: homeworkId } });
  if (!homework || homework.schoolId !== auth.user.schoolId) return err("Not found", 404);

  if (auth.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: auth.user.id } });
    if (!student) return err("Not found", 404);
    const submissions = await prisma.homeworkSubmission.findMany({
      where: { homeworkId, studentId: student.id },
      include: { student: { include: { user: { select: { fullName: true } } } } }
    });
    return ok({ submissions });
  }

  if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher || homework.teacherId !== teacher.id) return err("Forbidden", 403);
  } else if (auth.user.role !== "DIRECTOR" && auth.user.role !== "PARENT") {
    return err("Forbidden", 403);
  }

  const submissions = await prisma.homeworkSubmission.findMany({
    where: { homeworkId },
    include: {
      student: { include: { user: { select: { id: true, fullName: true } } } }
    },
    orderBy: { submittedAt: "desc" }
  });

  return ok({ submissions });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "STUDENT") return err("Only students can submit homework", 403);

    const student = await prisma.student.findUnique({ where: { userId: auth.user.id } });
    if (!student) return err("Student not found", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const homework = await prisma.homework.findUnique({ where: { id: parsed.data.homeworkId } });
    if (!homework) return err("Homework not found", 404);
    if (homework.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const existing = await prisma.homeworkSubmission.findUnique({
      where: { homeworkId_studentId: { homeworkId: parsed.data.homeworkId, studentId: student.id } }
    });
    if (existing) return err("You have already submitted this homework", 409);

    const submission = await prisma.homeworkSubmission.create({
      data: {
        homeworkId: homework.id,
        studentId: student.id,
        content: parsed.data.content ?? null,
        fileUrl: parsed.data.fileUrl ?? null
      },
      include: { student: { include: { user: { select: { fullName: true } } } } }
    });

    const teacherUser = await prisma.teacher.findUnique({ where: { id: homework.teacherId }, select: { userId: true } });
    if (teacherUser) {
      await prisma.notification.create({
        data: {
          userId: teacherUser.userId,
          title: "Homework submitted",
          message: `${submission.student.user.fullName} submitted "${homework.title}"`,
          type: "INFO",
          link: `/homework/${homework.id}`
        }
      });
    }

    return ok({ submission });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
