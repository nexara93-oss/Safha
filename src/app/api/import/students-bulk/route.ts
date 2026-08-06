import { NextRequest } from "next/server";
import { prisma, hashPassword, generateStrongPassword } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  students: z
    .array(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(0),
        serialNumber: z.string().optional()
      })
    )
    .min(1)
    .max(500)
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "TEACHER" && auth.user.role !== "DIRECTOR") return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422);

    let teacherId: string | undefined = undefined;
    if (auth.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
      teacherId = teacher?.id;
    }

    const created: { id: string; fullName: string; defaultPassword: string }[] = [];

    for (const s of parsed.data.students) {
      const fullName = `${s.firstName}${s.lastName ? " " + s.lastName : ""}`;
      const defaultPwd = generateStrongPassword();
      const passwordHash = await hashPassword(defaultPwd);

      const student = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            fullName,
            passwordHash,
            role: "STUDENT",
            schoolId: auth.user.schoolId!
          }
        });
        const st = await tx.student.create({
          data: {
            userId: user.id,
            schoolId: auth.user.schoolId!,
            teacherId: teacherId || null,
            serialNumber: s.serialNumber || null
          }
        });
        return { st, defaultPwd };
      });

      created.push({ id: student.st.id, fullName, defaultPassword: student.defaultPwd });
    }

    return ok({ students: created, count: created.length });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
