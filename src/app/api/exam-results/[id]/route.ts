import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const updateSchema = z.object({
  score: z.number().min(0).nullable(),
  maxScore: z.number().min(0).optional(),
  remarks: z.string().max(500).nullish()
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return err("Forbidden", 403);
    if (auth.user.role !== "TEACHER" && auth.user.role !== "DIRECTOR") return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const result = await prisma.finalExamResult.findUnique({ where: { id: params.id } });
    if (!result) return err("Not found", 404);

    const updated = await prisma.finalExamResult.update({
      where: { id: params.id },
      data: {
        score: parsed.data.score ?? result.score,
        maxScore: parsed.data.maxScore ?? result.maxScore,
        remarks: parsed.data.remarks !== undefined ? parsed.data.remarks : result.remarks,
        gradedAt: new Date()
      }
    });
    return ok({ result: updated });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
