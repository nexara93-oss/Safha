import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || auth.user.role !== "ADMIN") return err("Forbidden", 403);

  const [schools, revenueResult, recentPayments, subscriptionCounts] = await Promise.all([
    prisma.school.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        createdAt: true,
        director: {
          select: { fullName: true, email: true, phone: true, status: true }
        },
        subscription: {
          select: { plan: true, endDate: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true }
    }),
    prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        plan: true,
        status: true,
        createdAt: true,
        school: { select: { name: true } }
      }
    }),
    prisma.subscription.groupBy({
      by: ["plan"],
      _count: true
    })
  ]);

  const [teacherCount, studentCount, directorCount] = await Promise.all([
    prisma.teacher.count(),
    prisma.student.count(),
    prisma.user.count({ where: { role: "DIRECTOR" } })
  ]);

  const planBreakdown = subscriptionCounts.map((s: { plan: string; _count: number }) => ({ plan: s.plan, _count: s._count }));

  return ok({
    schools,
    users: { directors: directorCount, teachers: teacherCount, students: studentCount },
    planBreakdown,
    totalRevenue: revenueResult._sum.amount || 0,
    recentPayments
  });
}
