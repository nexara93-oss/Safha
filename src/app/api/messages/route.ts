import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  recipientId: z.string().min(1),
  content: z.string().min(1).max(2000)
});

type Contact = { id: string; fullName: string; role: string };

async function contactsFor(auth: NonNullable<Awaited<ReturnType<typeof getAuthFromRequest>>>["user"], schoolId: string): Promise<Contact[]> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { director: { select: { id: true, fullName: true, role: true } } }
  });
  const director = school?.director ?? null;

  const [teachers, students] = await Promise.all([
    prisma.teacher.findMany({
      where: { schoolId },
      select: { user: { select: { id: true, fullName: true, role: true } } }
    }),
    prisma.student.findMany({
      where: { schoolId },
      select: { user: { select: { id: true, fullName: true, role: true } } }
    })
  ]);

  const teacherUsers = teachers.map((t) => t.user);
  const studentUsers = students.map((s) => s.user);

  let list: Contact[] = [];
  if (auth.role === "DIRECTOR") {
    list = [...teacherUsers, ...studentUsers];
  } else if (auth.role === "TEACHER") {
    list = [...studentUsers];
    if (director) list.push(director);
  } else if (auth.role === "STUDENT") {
    list = [...teacherUsers];
    if (director) list.push(director);
  }

  return list
    .filter((c) => c.id !== auth.id)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" }));
}

async function sameSchoolUser(auth: NonNullable<Awaited<ReturnType<typeof getAuthFromRequest>>>["user"], userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  if (user.role === "DIRECTOR") {
    return user.schoolId === auth.schoolId ? user : null;
  }
  if (user.role === "TEACHER") {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { schoolId: true } });
    return t && t.schoolId === auth.schoolId ? user : null;
  }
  if (user.role === "STUDENT") {
    const s = await prisma.student.findUnique({ where: { userId: user.id }, select: { schoolId: true } });
    return s && s.schoolId === auth.schoolId ? user : null;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const me = auth.user.id;
  const schoolId = auth.user.schoolId;

  const [messages, contacts] = await Promise.all([
    prisma.message.findMany({
      where: {
        schoolId,
        OR: [
          { senderId: me, recipientId: { not: null } },
          { recipientId: me }
        ]
      },
      include: { sender: { select: { id: true, fullName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 500
    }),
    contactsFor(auth.user, schoolId)
  ]);

  const recipientIds = [...new Set(messages.map((m) => m.recipientId).filter((v): v is string => Boolean(v)))];
  const recipients = recipientIds.length
    ? await prisma.user.findMany({ where: { id: { in: recipientIds } }, select: { id: true, fullName: true, role: true } })
    : [];
  const recipientMap = new Map(recipients.map((u) => [u.id, u]));

  return ok({
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      read: m.read,
      recipientType: m.recipientType,
      recipientId: m.recipientId,
      sender: m.sender,
      recipient: m.recipientId ? (recipientMap.get(m.recipientId) ?? null) : null
    })),
    contacts
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const recipient = await sameSchoolUser(auth.user, parsed.data.recipientId);
    if (!recipient) return err("Recipient not found in your school", 404);

    const allowed: Record<string, string[]> = {
      STUDENT: ["TEACHER", "DIRECTOR"],
      TEACHER: ["STUDENT", "DIRECTOR"],
      DIRECTOR: ["TEACHER", "STUDENT"]
    };
    if (!allowed[auth.user.role]?.includes(recipient.role)) {
      return err("You cannot message this user", 403);
    }

    const message = await prisma.message.create({
      data: {
        senderId: auth.user.id,
        schoolId: auth.user.schoolId,
        recipientType: recipient.role,
        recipientId: recipient.id,
        content: parsed.data.content
      },
      include: { sender: { select: { id: true, fullName: true, role: true } } }
    });

    return ok({
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        read: message.read,
        recipientType: message.recipientType,
        recipientId: message.recipientId,
        sender: message.sender,
        recipient: { id: recipient.id, fullName: recipient.fullName, role: recipient.role }
      }
    });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
