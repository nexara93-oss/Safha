import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const updateSchema = z.object({
  subject: z.string().min(1).max(60).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(10000).nullish(),
  fileUrl: z.string().url().max(500).nullish(),
  videoUrl: z.string().url().max(500).nullish()
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      section: { select: { id: true, name: true } }
    }
  });
  if (!lesson) return err("Not found", 404);
  if (lesson.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

  return ok({ lesson });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) return err("Not found", 404);
  if (lesson.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

  if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher || lesson.teacherId !== teacher.id) return err("Forbidden", 403);
  } else if (auth.user.role !== "DIRECTOR") {
    return err("Forbidden", 403);
  }

  await prisma.lesson.delete({ where: { id } });
  return ok({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return err("Not found", 404);
    if (lesson.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    if (auth.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
      if (!teacher || lesson.teacherId !== teacher.id) return err("Forbidden", 403);
    } else if (auth.user.role !== "DIRECTOR") {
      return err("Forbidden", 403);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const updated = await prisma.lesson.update({
      where: { id },
      data: parsed.data,
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
        section: { select: { id: true, name: true } }
      }
    });
    return ok({ lesson: updated });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
