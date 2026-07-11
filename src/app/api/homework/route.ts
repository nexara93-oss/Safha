import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  sectionId: z.string(),
  subject: z.string().min(1).max(60),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  dueDate: z.string().datetime(),
  fileUrl: z.string().url().max(500).nullish()
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
  } else if (auth.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (teacher) where.teacherId = teacher.id;
  }

  if (sectionId) where.sectionId = sectionId;

  const homeworks = await prisma.homework.findMany({
    where,
    include: {
      teacher: { include: { user: { select: { fullName: true } } } },
      section: { select: { id: true, name: true } },
      _count: { select: { submissions: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return ok({ homeworks });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "TEACHER") return err("Only teachers can create homework", 403);

    const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
    if (!teacher) return err("Teacher not found", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const section = await prisma.section.findUnique({ where: { id: parsed.data.sectionId } });
    if (!section || section.schoolId !== auth.user.schoolId) return err("Section not found in your school", 404);

    const homework = await prisma.homework.create({
      data: {
        schoolId: auth.user.schoolId,
        teacherId: teacher.id,
        sectionId: section.id,
        subject: parsed.data.subject,
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: new Date(parsed.data.dueDate),
        fileUrl: parsed.data.fileUrl ?? null
      },
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
        section: { select: { id: true, name: true } }
      }
    });
    return ok({ homework });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
