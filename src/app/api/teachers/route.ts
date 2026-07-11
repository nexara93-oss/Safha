import { NextRequest } from "next/server";
import { prisma, hashPassword, generateStrongPassword, generateTeacherEmail } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  subject: z.string().min(1).max(60)
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId || auth.user.role !== "DIRECTOR") {
    return err("Forbidden", 403);
  }
  const teachers = await prisma.teacher.findMany({
    where: { schoolId: auth.user.schoolId },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, status: true } },
      _count: { select: { students: true, sections: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return ok({
    teachers: teachers.map((t) => ({
      id: t.id,
      userId: t.userId,
      schoolId: t.schoolId,
      subject: t.subject,
      generatedEmail: t.generatedEmail,
      generatedPassword: t.generatedPassword,
      createdAt: t.createdAt,
      user: t.user,
      _count: t._count
    }))
  }, {
    headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" }
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId || auth.user.role !== "DIRECTOR") {
      return err("Forbidden", 403);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const school = await prisma.school.findUnique({ where: { id: auth.user.schoolId } });
    if (!school) return err("School not found", 404);

    // Generate a unique email
    let email = generateTeacherEmail(parsed.data.firstName, parsed.data.lastName, school.name);
    let attempts = 0;
    while (await prisma.user.findUnique({ where: { email } })) {
      attempts += 1;
      email = generateTeacherEmail(parsed.data.firstName, parsed.data.lastName, school.name).replace(
        "@",
        `${attempts}@`
      );
      if (attempts > 50) return err("Could not generate unique email", 500);
    }

    // Generate a unique password
    let password = generateStrongPassword();
    let pwAttempts = 0;
    while (await prisma.teacher.findFirst({ where: { generatedPassword: password } })) {
      password = generateStrongPassword();
      pwAttempts += 1;
      if (pwAttempts > 50) return err("Could not generate unique password", 500);
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: `${parsed.data.firstName} ${parsed.data.lastName}`,
          email,
          passwordHash,
          role: "TEACHER",
          schoolId: school.id
        }
      });
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          subject: parsed.data.subject,
          generatedEmail: email,
          generatedPassword: password
        }
      });
      return { user, teacher };
    });

    return ok({
      teacher: result.teacher,
      credentials: {
        email,
        password
      }
    });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
