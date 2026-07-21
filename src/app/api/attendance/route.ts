import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  studentId: z.string(),
  date: z.string().optional(), // ISO date; defaults to today
  status: z.enum(["PRESENT", "ABSENT"])
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);

  if (auth.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: auth.user.id } });
    if (!student) return err("Not found", 404);
    const recs = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
      take: 60
    });
    return ok({ attendance: recs });
  }

  if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher) return err("Not found", 404);
    const students = await prisma.student.findMany({
      where: { teacherId: teacher.id },
      select: { id: true }
    });
    const recs = await prisma.attendance.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      orderBy: { date: "desc" },
      take: 200
    });
    return ok({ attendance: recs });
  }

  // Director: all in school
  if (auth.user.role === "DIRECTOR" && auth.user.schoolId) {
    const students = await prisma.student.findMany({
      where: { schoolId: auth.user.schoolId },
      select: { id: true }
    });
    const recs = await prisma.attendance.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      orderBy: { date: "desc" },
      take: 500
    });
    return ok({ attendance: recs });
  }

  return err("Forbidden", 403);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return err("Forbidden", 403);
    if (auth.user.role !== "TEACHER" && auth.user.role !== "DIRECTOR") {
      return err("Forbidden", 403);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422);

    const student = await prisma.student.findUnique({ where: { id: parsed.data.studentId } });
    if (!student) return err("Student not found", 404);
    if (student.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const date = parsed.data.date ? new Date(parsed.data.date + "T00:00:00.000Z") : new Date();

    const rec = await prisma.attendance.upsert({
      where: { studentId_date: { studentId: student.id, date } },
      create: { studentId: student.id, date, status: parsed.data.status },
      update: { status: parsed.data.status }
    });
    return ok({ attendance: rec });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
