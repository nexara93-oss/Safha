import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) return err("Not found", 404);
  if (message.schoolId !== auth.user.schoolId) return err("Forbidden", 403);
  if (message.recipientId && message.recipientId !== auth.user.id && message.senderId !== auth.user.id) {
    return err("Forbidden", 403);
  }

  await prisma.message.update({
    where: { id },
    data: { read: true }
  });
  return ok({ success: true });
}
