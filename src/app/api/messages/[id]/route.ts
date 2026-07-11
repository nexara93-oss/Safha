import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromRequest(req);
  if (!auth) return err("Forbidden", 403);

  await prisma.message.update({
    where: { id: params.id },
    data: { read: true }
  });
  return ok({ success: true });
}
