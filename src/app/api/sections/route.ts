import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(60)
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const where: any = { schoolId: auth.user.schoolId };
  if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id }, select: { id: true } });
    if (teacher) where.teacherId = teacher.id;
  }

  const sections = await prisma.section.findMany({
    where,
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      _count: { select: { students: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return ok({ sections }, {
    headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" }
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    let teacherId: string | undefined = undefined;
    if (auth.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id }, select: { id: true, schoolId: true } });
      if (teacher && teacher.schoolId === auth.user.schoolId) {
        teacherId = teacher.id;
      }
    } else if (auth.user.role !== "DIRECTOR") {
      return err("Forbidden", 403);
    }

    const section = await prisma.section.create({
      data: {
        name: parsed.data.name.trim(),
        schoolId: auth.user.schoolId,
        teacherId: teacherId || null
      }
    });
    return ok({ section });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
