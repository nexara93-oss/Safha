import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || auth.user.role !== "STUDENT") return err("Forbidden", 403);

  const student = await prisma.student.findUnique({
    where: { userId: auth.user.id },
    include: {
      user: true,
      teacher: { include: { user: { select: { fullName: true } } } },
      section: true,
      school: { select: { name: true, logoUrl: true } }
    }
  });
  if (!student) return err("Student not found", 404);

  const [grades, attendance, behavior, periods, messages] = await Promise.all([
    prisma.grade.findMany({
      where: { studentId: student.id },
      include: { period: true, teacher: { include: { user: { select: { fullName: true } } } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.attendance.findMany({ where: { studentId: student.id }, orderBy: { date: "desc" }, take: 60 }),
    prisma.behavior.findMany({
      where: { studentId: student.id },
      include: { teacher: { include: { user: { select: { fullName: true } } } } },
      orderBy: { date: "desc" }
    }),
    prisma.examPeriod.findMany({ where: { schoolId: student.schoolId }, orderBy: { startDate: "asc" } }),
    prisma.message.findMany({
      where: { schoolId: student.schoolId },
      include: { sender: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  // Compute averages
  const byPeriod: Record<string, { total: number; count: number; weighted: number; coefTotal: number }> = {};
  for (const g of grades) {
    const k = g.periodId;
    if (!byPeriod[k]) byPeriod[k] = { total: 0, count: 0, weighted: 0, coefTotal: 0 };
    byPeriod[k].total += g.score;
    byPeriod[k].count += 1;
    byPeriod[k].weighted += g.score * g.period.coefficient;
    byPeriod[k].coefTotal += g.period.coefficient;
  }
  const periodAverages = Object.entries(byPeriod).map(([periodId, v]) => ({
    periodId,
    average: v.count ? v.total / v.count : 0,
    weightedAverage: v.coefTotal ? v.weighted / v.coefTotal : 0,
    examCount: v.count
  }));

  const allWeighted = grades.reduce((acc, g) => acc + g.score * g.period.coefficient, 0);
  const allCoef = grades.reduce((acc, g) => acc + g.period.coefficient, 0);
  const overallAverage = allCoef > 0 ? allWeighted / allCoef : 0;

  return ok({
    student,
    grades,
    attendance,
    behavior,
    periods,
    messages,
    periodAverages,
    overallAverage
  });
}
