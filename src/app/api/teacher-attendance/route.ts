import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["PRESENT", "ABSENT"])
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return err("Forbidden", 403);
    if (auth.user.role !== "TEACHER") return err("Only teachers can mark teacher attendance", 403);

    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher) return err("Teacher profile not found", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.teacherAttendance.upsert({
      where: { teacherId_date: { teacherId: teacher.id, date: today } },
      create: { teacherId: teacher.id, date: today, status: parsed.data.status },
      update: { status: parsed.data.status }
    });
    return ok({ attendance });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher) return err("Teacher not found", 404);
    const rec = await prisma.teacherAttendance.findUnique({
      where: { teacherId_date: { teacherId: teacher.id, date: today } }
    });
    return ok({ today: rec });
  }

  if (auth.user.role === "DIRECTOR" && auth.user.schoolId) {
    const teachers = await prisma.teacher.findMany({
      where: { schoolId: auth.user.schoolId },
      include: {
        user: { select: { fullName: true, status: true } },
        attendance: { where: { date: today } }
      }
    });
    return ok({ teachers });
  }

  return err("Forbidden", 403);
}
