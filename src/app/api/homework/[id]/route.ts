import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const updateSchema = z.object({
  subject: z.string().min(1).max(60).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  dueDate: z.string().datetime().optional(),
  fileUrl: z.string().url().max(500).nullish()
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const homework = await prisma.homework.findUnique({
    where: { id: params.id },
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      section: { select: { id: true, name: true } },
      submissions: {
        include: {
          student: { include: { user: { select: { id: true, fullName: true } } } }
        },
        orderBy: { submittedAt: "desc" }
      }
    }
  });
  if (!homework) return err("Not found", 404);
  if (homework.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

  return ok({ homework });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const homework = await prisma.homework.findUnique({ where: { id: params.id } });
  if (!homework) return err("Not found", 404);
  if (homework.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

  if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher || homework.teacherId !== teacher.id) return err("Forbidden", 403);
  } else if (auth.user.role !== "DIRECTOR") {
    return err("Forbidden", 403);
  }

  await prisma.homework.delete({ where: { id: params.id } });
  return ok({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

    const homework = await prisma.homework.findUnique({ where: { id: params.id } });
    if (!homework) return err("Not found", 404);
    if (homework.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    if (auth.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
      if (!teacher || homework.teacherId !== teacher.id) return err("Forbidden", 403);
    } else if (auth.user.role !== "DIRECTOR") {
      return err("Forbidden", 403);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const updateData: any = { ...parsed.data };
    if (parsed.data.dueDate) updateData.dueDate = new Date(parsed.data.dueDate);

    const updated = await prisma.homework.update({
      where: { id: params.id },
      data: updateData,
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
        section: { select: { id: true, name: true } }
      }
    });
    return ok({ homework: updated });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
