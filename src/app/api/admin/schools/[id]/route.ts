import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"])
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthFromRequest(req);
    if (!auth || auth.user.role !== "ADMIN") return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err("Invalid status", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) return err("Not found", 404);

    await prisma.user.update({
      where: { id: school.directorId },
      data: { status: parsed.data.status }
    });
    return ok({ success: true });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
