import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  recipientType: z.enum(["TEACHER", "STUDENT", "ALL_TEACHERS", "ALL_STUDENTS", "DIRECTOR"]),
  recipientId: z.string().nullish(),
  content: z.string().min(1).max(2000)
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const orConditions: any[] = [
    { senderId: auth.user.id },
    { recipientId: auth.user.id }
  ];

  if (auth.user.role === "TEACHER" || auth.user.role === "DIRECTOR") {
    orConditions.push({ recipientType: "ALL_TEACHERS" });
  }
  if (auth.user.role === "STUDENT" || auth.user.role === "DIRECTOR") {
    orConditions.push({ recipientType: "ALL_STUDENTS" });
  }
  if (auth.user.role === "DIRECTOR") {
    orConditions.push({ recipientType: "DIRECTOR" });
  }

  const whereCondition: any = {
    schoolId: auth.user.schoolId,
    OR: orConditions
  };

  const messages = await prisma.message.findMany({
    where: whereCondition,
    include: { sender: { select: { id: true, fullName: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return ok({ messages });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    // Validate recipient type matches role rules
    if (auth.user.role === "STUDENT") {
      if (parsed.data.recipientType !== "ALL_TEACHERS" && parsed.data.recipientType !== "TEACHER") {
        return err("Students can only message teachers", 403);
      }
    } else if (auth.user.role === "TEACHER") {
      if (!["STUDENT", "ALL_STUDENTS", "DIRECTOR"].includes(parsed.data.recipientType)) {
        return err("Teachers can only message students or directors", 403);
      }
    } else if (auth.user.role === "DIRECTOR") {
      if (!["TEACHER", "ALL_TEACHERS", "STUDENT", "ALL_STUDENTS"].includes(parsed.data.recipientType)) {
        return err("Directors can only message teachers or students", 403);
      }
    }

    // For ALL_* messages we still record them; clients filter accordingly.
    // Resolve recipient profile id (Teacher.id / Student.id) → User.id
    // so the GET query can match against auth.user.id
    let resolvedRecipientId = parsed.data.recipientId || null;
    if (resolvedRecipientId) {
      if (parsed.data.recipientType === "TEACHER") {
        const t = await prisma.teacher.findUnique({ where: { id: resolvedRecipientId }, select: { userId: true, schoolId: true } });
        if (!t || t.schoolId !== auth.user.schoolId) return err("Teacher not found in your school", 404);
        resolvedRecipientId = t.userId;
      } else if (parsed.data.recipientType === "STUDENT") {
        const s = await prisma.student.findUnique({ where: { id: resolvedRecipientId }, select: { userId: true, schoolId: true } });
        if (!s || s.schoolId !== auth.user.schoolId) return err("Student not found in your school", 404);
        resolvedRecipientId = s.userId;
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: auth.user.id,
        schoolId: auth.user.schoolId,
        recipientType: parsed.data.recipientType,
        recipientId: resolvedRecipientId,
        content: parsed.data.content
      },
      include: { sender: { select: { id: true, fullName: true, role: true } } }
    });
    return ok({ message });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
