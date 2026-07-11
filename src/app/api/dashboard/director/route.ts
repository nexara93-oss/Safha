import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

/**
 * Director dashboard summary.
 * Returns aggregated stats for the director's school.
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || auth.user.role !== "DIRECTOR" || !auth.user.schoolId) return err("Forbidden", 403);

  const schoolId = auth.user.schoolId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    teacherCount,
    studentCount,
    sectionCount,
    teachers,
    recentMessages,
    subscription
  ] = await Promise.all([
    prisma.teacher.count({ where: { schoolId } }),
    prisma.student.count({ where: { schoolId } }),
    prisma.section.count({ where: { schoolId } }),
    prisma.teacher.findMany({
      where: { schoolId },
      include: { user: { select: { fullName: true, status: true } }, attendance: { where: { date: today } } }
    }),
    prisma.message.findMany({
      where: { schoolId },
      include: { sender: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.subscription.findUnique({ where: { schoolId } })
  ]);

  const todayPresent = teachers.filter((t) => t.attendance[0]?.status === "PRESENT").length;
  const todayAbsent = teachers.filter((t) => t.attendance[0]?.status === "ABSENT").length;
  const todayUnknown = teachers.length - todayPresent - todayAbsent;

  let trialDaysLeft: number | null = null;
  if (subscription?.plan === "FREE_TRIAL") {
    const ms = new Date(subscription.endDate).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }

  return ok({
    stats: {
      teacherCount,
      studentCount,
      sectionCount,
      todayPresent,
      todayAbsent,
      todayUnknown
    },
    teachers,
    recentMessages,
    subscription,
    trialDaysLeft
  });
}
