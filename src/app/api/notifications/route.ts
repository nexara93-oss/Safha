import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  userId: z.string(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]),
  link: z.string().max(500).nullish()
});

const markReadSchema = z.object({
  id: z.string().optional(),
  markAll: z.boolean().optional(),
  read: z.boolean().default(true)
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const notifications = await prisma.notification.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return ok({ notifications });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return err("Forbidden", 403);
    if (auth.user.role !== "DIRECTOR" && auth.user.role !== "TEACHER" && auth.user.role !== "ADMIN") return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const targetUser = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!targetUser || targetUser.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const notification = await prisma.notification.create({
      data: {
        userId: parsed.data.userId,
        title: parsed.data.title,
        message: parsed.data.message,
        type: parsed.data.type,
        link: parsed.data.link ?? null
      }
    });
    return ok({ notification });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    if (parsed.data.markAll) {
      await prisma.notification.updateMany({
        where: { userId: auth.user.id, read: false },
        data: { read: true }
      });
      return ok({ success: true });
    }

    if (!parsed.data.id) return err("id or markAll required", 400);

    const notification = await prisma.notification.findUnique({ where: { id: parsed.data.id } });
    if (!notification) return err("Not found", 404);
    if (notification.userId !== auth.user.id) return err("Forbidden", 403);

    const updated = await prisma.notification.update({
      where: { id: parsed.data.id },
      data: { read: parsed.data.read }
    });
    return ok({ notification: updated });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
