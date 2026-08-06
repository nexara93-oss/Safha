import { NextRequest } from "next/server";
import { prisma, hashPassword, generateStrongPassword } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  phone: z.string().optional(),
  serialNumber: z.string().optional(),
  sectionId: z.string().optional(),
  email: z.string().email().optional()
});

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

async function generateUniqueEmail(base: string): Promise<string> {
  let email = base;
  let i = 1;
  while (await prisma.user.findUnique({ where: { email } })) {
    email = `${base}.${i}`;
    i++;
  }
  return email;
}

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
  if (auth.user.role === "STUDENT") return err("Forbidden", 403);

  const students = await prisma.student.findMany({
    where: { schoolId: auth.user.schoolId },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, status: true } },
      teacher: { include: { user: { select: { fullName: true } } } },
      section: { select: { id: true, name: true } },
      grades: { include: { period: { select: { coefficient: true } } } },
      attendance: { orderBy: { date: "desc" }, take: 30 },
      behavior: { orderBy: { date: "desc" }, take: 10 }
    },
    orderBy: { createdAt: "desc" }
  });
  return ok({ students }, {
    headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" }
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER") return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`;

    // Generate email: provided or auto-generated
    const email = parsed.data.email || await generateUniqueEmail(
      `${slugify(parsed.data.firstName)}.${slugify(parsed.data.lastName)}@gmail.com`
    );

    // Default password = 12 characters: 4 lowercase + 3 uppercase + 2 digits + 3 symbols (shuffled)
    const defaultPwd = generateStrongPassword();
    const passwordHash = await hashPassword(defaultPwd);

    // Determine teacher (only teachers can create students from their UI; director can choose one)
    let teacherId: string | undefined = undefined;
    if (auth.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: auth.user.id } });
      teacherId = teacher?.id;
    }

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email,
          phone: parsed.data.phone || null,
          passwordHash,
          role: "STUDENT",
          schoolId: auth.user.schoolId!
        }
      });
      const s = await tx.student.create({
        data: {
          userId: user.id,
          schoolId: auth.user.schoolId!,
          teacherId: teacherId || null,
          sectionId: parsed.data.sectionId || null,
          serialNumber: parsed.data.serialNumber || null
        }
      });
      return s;
    });

    return ok({ student, email, defaultPassword: defaultPwd });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
