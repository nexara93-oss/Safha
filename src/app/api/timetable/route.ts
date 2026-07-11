import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  subject: z.string().min(1).max(60),
  teacherId: z.string(),
  sectionId: z.string(),
  room: z.string().max(50).nullish()
});

const updateSchema = z.object({
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  subject: z.string().min(1).max(60).optional(),
  teacherId: z.string().optional(),
  sectionId: z.string().optional(),
  room: z.string().max(50).nullish()
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");
  const sectionId = searchParams.get("sectionId");

  const where: any = { schoolId: auth.user.schoolId };

  if (auth.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: auth.user.id } });
    if (!student) return err("Not found", 404);
    where.sectionId = student.sectionId;
  } else if (auth.user.role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId: auth.user.id },
      include: { students: { select: { studentId: true } } }
    });
    if (!parent) return err("Not found", 404);
    const students = await prisma.student.findMany({
      where: { id: { in: parent.students.map((s) => s.studentId) } },
      select: { sectionId: true }
    });
    where.sectionId = { in: students.map((s) => s.sectionId).filter(Boolean) };
  } else if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (teacher) where.teacherId = teacher.id;
  }

  if (teacherId) where.teacherId = teacherId;
  if (sectionId) where.sectionId = sectionId;

  const slots = await prisma.timetableSlot.findMany({
    where,
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      section: { select: { id: true, name: true } }
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }]
  });

  return ok({ slots });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER") return err("Only directors and teachers can create timetable slots", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const teacher = await prisma.teacher.findUnique({ where: { id: parsed.data.teacherId } });
    if (!teacher || teacher.schoolId !== auth.user.schoolId) return err("Teacher not found in your school", 404);

    const section = await prisma.section.findUnique({ where: { id: parsed.data.sectionId } });
    if (!section || section.schoolId !== auth.user.schoolId) return err("Section not found in your school", 404);

    const slot = await prisma.timetableSlot.create({
      data: {
        schoolId: auth.user.schoolId,
        day: parsed.data.day,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        subject: parsed.data.subject,
        teacherId: teacher.id,
        sectionId: section.id,
        room: parsed.data.room ?? null
      },
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
        section: { select: { id: true, name: true } }
      }
    });
    return ok({ slot });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER") return err("Only directors and teachers can update timetable slots", 403);

    const body = await req.json().catch(() => ({}));
    const { id, ...data } = body;
    if (!id) return err("Missing slot id", 400);

    const parsed = updateSchema.safeParse(data);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const existing = await prisma.timetableSlot.findUnique({ where: { id } });
    if (!existing) return err("Slot not found", 404);
    if (existing.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    if (parsed.data.teacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: parsed.data.teacherId } });
      if (!teacher || teacher.schoolId !== auth.user.schoolId) return err("Teacher not found in your school", 404);
    }

    if (parsed.data.sectionId) {
      const section = await prisma.section.findUnique({ where: { id: parsed.data.sectionId } });
      if (!section || section.schoolId !== auth.user.schoolId) return err("Section not found in your school", 404);
    }

    const slot = await prisma.timetableSlot.update({
      where: { id },
      data: parsed.data,
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
        section: { select: { id: true, name: true } }
      }
    });
    return ok({ slot });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
  if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER") return err("Only directors and teachers can delete timetable slots", 403);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return err("Missing slot id", 400);

  const existing = await prisma.timetableSlot.findUnique({ where: { id } });
  if (!existing) return err("Slot not found", 404);
  if (existing.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

  await prisma.timetableSlot.delete({ where: { id } });
  return ok({ success: true });
}
