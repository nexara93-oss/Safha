import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || auth.user.role !== "TEACHER") return err("Forbidden", 403);

  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.user.id },
    include: {
      user: true,
      students: { include: { user: { select: { fullName: true, phone: true } } } },
      sections: { include: { _count: { select: { students: true } } } },
      grades: { take: 10, orderBy: { createdAt: "desc" } }
    }
  });
  if (!teacher) return err("Teacher not found", 404);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = await prisma.teacherAttendance.findUnique({
    where: { teacherId_date: { teacherId: teacher.id, date: today } }
  });

  const studentIds = teacher.students.map((s) => s.id);
  const todayStudentAttendance = await prisma.attendance.findMany({
    where: { studentId: { in: studentIds }, date: today }
  });

  return ok({
    teacher: { ...teacher, generatedPassword: undefined }, // never expose password in dashboard
    todayAttendance,
    todayStudentAttendance
  });
}
