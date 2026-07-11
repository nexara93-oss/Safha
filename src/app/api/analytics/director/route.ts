import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
  if (auth.user.role !== "DIRECTOR") return err("Only directors can access analytics", 403);

  const schoolId = auth.user.schoolId;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [sections, attendanceRecords, grades, students] = await Promise.all([
    prisma.section.findMany({
      where: { schoolId },
      include: { _count: { select: { students: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.attendance.findMany({
      where: {
        student: { schoolId },
        date: { gte: thirtyDaysAgo }
      }
    }),
    prisma.grade.findMany({
      where: { student: { schoolId } },
      include: { student: { include: { user: { select: { fullName: true } } } } }
    }),
    prisma.student.findMany({
      where: { schoolId },
      include: { user: { select: { id: true, fullName: true } } }
    })
  ]);

  // Total students per section
  const studentsPerSection = sections.map((s) => ({
    sectionId: s.id,
    sectionName: s.name,
    totalStudents: s._count.students
  }));

  // Attendance rate (last 30 days)
  const totalAttendance = attendanceRecords.length;
  const presentAttendance = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;

  // Average grades per subject
  const subjectMap: Record<string, { total: number; count: number }> = {};
  grades.forEach((g) => {
    if (!subjectMap[g.subject]) subjectMap[g.subject] = { total: 0, count: 0 };
    subjectMap[g.subject].total += (g.score / g.maxScore) * 100;
    subjectMap[g.subject].count += 1;
  });
  const averageGradesPerSubject = Object.entries(subjectMap).map(([subject, data]) => ({
    subject,
    average: Math.round((data.total / data.count) * 100) / 100,
    count: data.count
  }));

  // Grade distribution
  const distribution = { "0-25%": 0, "25-50%": 0, "50-75%": 0, "75-100%": 0 };
  grades.forEach((g) => {
    const pct = (g.score / g.maxScore) * 100;
    if (pct < 25) distribution["0-25%"]++;
    else if (pct < 50) distribution["25-50%"]++;
    else if (pct < 75) distribution["50-75%"]++;
    else distribution["75-100%"]++;
  });

  // Top/bottom performing students (by average grade percentage)
  const studentGradeMap: Record<string, { total: number; count: number; name: string }> = {};
  grades.forEach((g) => {
    if (!studentGradeMap[g.studentId]) {
      const student = students.find((s) => s.id === g.studentId);
      studentGradeMap[g.studentId] = { total: 0, count: 0, name: student?.user.fullName ?? "Unknown" };
    }
    studentGradeMap[g.studentId].total += (g.score / g.maxScore) * 100;
    studentGradeMap[g.studentId].count += 1;
  });

  const studentAverages = Object.entries(studentGradeMap)
    .map(([studentId, data]) => ({
      studentId,
      studentName: data.name,
      average: Math.round((data.total / data.count) * 100) / 100
    }))
    .sort((a, b) => b.average - a.average);

  const top10 = studentAverages.slice(0, 10);
  const bottom10 = studentAverages.slice(-10).reverse();

  return ok({
    studentsPerSection,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
    totalAttendanceRecords: totalAttendance,
    presentAttendance,
    averageGradesPerSubject,
    gradeDistribution: distribution,
    topPerformingStudents: top10,
    bottomPerformingStudents: bottom10
  });
}
