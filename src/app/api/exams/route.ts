import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  sectionId: z.string(),
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(60),
  date: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  coefficient: z.number().min(0).default(1.0),
  maxScore: z.number().min(0.1).default(20)
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const { searchParams } = new URL(req.url);
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
  }

  if (sectionId && (auth.user.role === "DIRECTOR" || auth.user.role === "TEACHER")) {
    where.sectionId = sectionId;
  }

  const exams = await prisma.finalExam.findMany({
    where,
    include: {
      section: { select: { id: true, name: true } },
      _count: { select: { results: true } }
    },
    orderBy: { date: "desc" }
  });

  return ok({ exams });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER") return err("Only directors and teachers can create exams", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const section = await prisma.section.findUnique({ where: { id: parsed.data.sectionId } });
    if (!section || section.schoolId !== auth.user.schoolId) return err("Section not found in your school", 404);

    const exam = await prisma.finalExam.create({
      data: {
        schoolId: auth.user.schoolId,
        sectionId: section.id,
        name: parsed.data.name,
        subject: parsed.data.subject,
        date: new Date(parsed.data.date),
        startTime: parsed.data.startTime ?? null,
        endTime: parsed.data.endTime ?? null,
        coefficient: parsed.data.coefficient,
        maxScore: parsed.data.maxScore
      },
      include: {
        section: { select: { id: true, name: true } }
      }
    });
    return ok({ exam });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
