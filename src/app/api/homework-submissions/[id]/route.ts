import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const gradeSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().max(2000).nullish(),
  maxScore: z.number().min(0.1).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "TEACHER") return err("Only teachers can grade submissions", 403);

    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher) return err("Teacher not found", 404);

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id },
      include: { homework: true }
    });
    if (!submission) return err("Submission not found", 404);
    if (submission.homework.schoolId !== auth.user.schoolId) return err("Forbidden", 403);
    if (submission.homework.teacherId !== teacher.id) return err("This homework is not yours", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = gradeSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const updated = await prisma.homeworkSubmission.update({
      where: { id },
      data: {
        score: parsed.data.score,
        feedback: parsed.data.feedback ?? null,
        maxScore: parsed.data.maxScore ?? submission.maxScore,
        gradedAt: new Date()
      },
      include: {
        student: { include: { user: { select: { id: true, fullName: true } } } }
      }
    });

    await prisma.notification.create({
      data: {
        userId: updated.student.user.id,
        title: "Homework graded",
        message: `Your submission for "${submission.homework.title}" has been graded: ${parsed.data.score}/${parsed.data.maxScore ?? submission.maxScore ?? 20}`,
        type: "SUCCESS",
        link: `/homework/${submission.homeworkId}`
      }
    });

    return ok({ submission: updated });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
