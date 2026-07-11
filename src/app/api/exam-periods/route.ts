import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(60),
  startDate: z.string(),
  endDate: z.string(),
  coefficient: z.number().min(0.1).max(10).default(1),
  examCount: z.number().int().min(1).max(20).default(1)
});

const updateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  coefficient: z.number().min(0.1).max(10).optional(),
  examCount: z.number().int().min(1).max(20).optional()
});

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const periods = await prisma.examPeriod.findMany({
    where: { schoolId: auth.user.schoolId },
    orderBy: { startDate: "asc" }
  });
  return ok({ periods });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || !auth.user.schoolId) return err("Forbidden", 403);
    if (auth.user.role !== "TEACHER" && auth.user.role !== "DIRECTOR") return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422, { fieldErrors: parsed.error.flatten().fieldErrors });

    const period = await prisma.examPeriod.create({
      data: {
        name: parsed.data.name,
        schoolId: auth.user.schoolId,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        coefficient: parsed.data.coefficient,
        examCount: parsed.data.examCount
      }
    });
    return ok({ period });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422);
    const { id, ...rest } = body as { id?: string; name?: string; startDate?: string; endDate?: string; coefficient?: number; examCount?: number };
    if (!id) return err("id required", 400);

    const period = await prisma.examPeriod.findUnique({ where: { id } });
    if (!period) return err("Not found", 404);
    if (period.schoolId !== auth.user.schoolId) return err("Forbidden", 403);

    const updated = await prisma.examPeriod.update({
      where: { id },
      data: {
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.startDate !== undefined && { startDate: new Date(rest.startDate) }),
        ...(rest.endDate !== undefined && { endDate: new Date(rest.endDate) }),
        ...(rest.coefficient !== undefined && { coefficient: rest.coefficient }),
        ...(rest.examCount !== undefined && { examCount: rest.examCount })
      }
    });
    return ok({ period: updated });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
