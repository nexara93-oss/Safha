import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);

  const message = await prisma.message.findUnique({ where: { id: params.id } });
  if (!message) return err("Not found", 404);
  if (message.schoolId !== auth.user.schoolId) return err("Forbidden", 403);
  if (message.recipientId && message.recipientId !== auth.user.id) return err("Forbidden", 403);

  const updated = await prisma.message.update({
    where: { id: params.id },
    data: { read: true }
  });
  return ok({ message: updated });
}
