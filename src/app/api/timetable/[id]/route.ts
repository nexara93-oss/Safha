import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const updateSchema = z.object({
  day: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  subject: z.string().min(1).max(60).optional(),
  teacherId: z.string().optional(),
  sectionId: z.string().optional(),
  room: z.string().nullish()
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);

  const slot = await prisma.timetableSlot.findUnique({
    where: { id: params.id },
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      section: { select: { id: true, name: true } }
    }
  });
  if (!slot) return err("Not found", 404);
  if (slot.schoolId !== auth.user.schoolId) return err("Forbidden", 403);
  return ok({ slot });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || auth.user.role !== "DIRECTOR") return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const slot = await prisma.timetableSlot.findUnique({ where: { id: params.id } });
    if (!slot) return err("Not found", 404);
    if (slot.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const updated = await prisma.timetableSlot.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
        section: { select: { id: true, name: true } }
      }
    });
    return ok({ slot: updated });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
  if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER") return err("Forbidden", 403);

  const slot = await prisma.timetableSlot.findUnique({ where: { id: params.id } });
  if (!slot) return err("Not found", 404);
  if (slot.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

  await prisma.timetableSlot.delete({ where: { id: params.id } });
  return ok({ success: true });
}
