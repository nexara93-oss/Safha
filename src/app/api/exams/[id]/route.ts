import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(60).optional(),
  date: z.string().datetime().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  coefficient: z.number().min(0).optional(),
  maxScore: z.number().min(0.1).optional()
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const exam = await prisma.finalExam.findUnique({
    where: { id },
    include: {
      section: { select: { id: true, name: true } },
      results: {
        include: { student: { include: { user: { select: { id: true, fullName: true } } } } },
        orderBy: { gradedAt: "desc" }
      }
    }
  });
  if (!exam) return err("Not found", 404);
  if (exam.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

  if (auth.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: auth.user.id } });
    if (!student) return err("Not found", 404);
    exam.results = exam.results.filter((r) => r.studentId === student.id);
  }

  return ok({ exam });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER") return err("Forbidden", 403);

    const exam = await prisma.finalExam.findUnique({ where: { id } });
    if (!exam) return err("Not found", 404);
    if (exam.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const updateData: any = { ...parsed.data };
    if (parsed.data.date) updateData.date = new Date(parsed.data.date);

    const updated = await prisma.finalExam.update({
      where: { id },
      data: updateData,
      include: { section: { select: { id: true, name: true } } }
    });
    return ok({ exam: updated });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
  if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER") return err("Forbidden", 403);

  const exam = await prisma.finalExam.findUnique({ where: { id } });
  if (!exam) return err("Not found", 404);
  if (exam.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

  await prisma.finalExam.delete({ where: { id } });
  return ok({ success: true });
}
