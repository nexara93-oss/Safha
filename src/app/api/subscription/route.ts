import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { ok, err, zodToErrorResponse } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["MONTHLY", "ANNUAL"]),
  method: z.enum(["visa", "virement"]).optional().default("visa"),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  cardName: z.string().optional(),
});

const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5_000;

export async function GET(req: NextRequest) {
  const auth = await getAuthFromRequest(req);
  if (!auth || !auth.user.schoolId) return err("Forbidden", 403);

  const cached = cache.get(auth.user.schoolId);
  if (cached && Date.now() < cached.expiry) {
    return Response.json(cached.data, {
      headers: { "Cache-Control": "public, max-age=5, stale-while-revalidate=30" }
    });
  }

  const sub = await prisma.subscription.findUnique({ where: { schoolId: auth.user.schoolId } });
  const payments = await prisma.payment.findMany({
    where: { schoolId: auth.user.schoolId },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  const data = { subscription: sub, payments };
  cache.set(auth.user.schoolId, { data, expiry: Date.now() + CACHE_TTL });
  return ok(data, { headers: { "Cache-Control": "public, max-age=5, stale-while-revalidate=30" } });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || auth.user.role !== "DIRECTOR" || !auth.user.schoolId) return err("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err("Validation failed", 422);

    const amount = parsed.data.plan === "MONTHLY" ? 20 : 119;
    const days = parsed.data.plan === "MONTHLY" ? 30 : 365;
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

    const methodLabel = parsed.data.method === "visa" ? "Visa/CB" : "Virement Bancaire";
    const isVisa = parsed.data.method === "visa";

    const result = await prisma.$transaction(async (tx) => {
      if (isVisa) {
        const sub = await tx.subscription.upsert({
          where: { schoolId: auth.user.schoolId! },
          create: { schoolId: auth.user.schoolId!, plan: parsed.data.plan, startDate: start, endDate: end },
          update: { plan: parsed.data.plan, startDate: start, endDate: end }
        });
        const payment = await tx.payment.create({
          data: { schoolId: auth.user.schoolId!, amount, plan: parsed.data.plan, status: "COMPLETED", method: methodLabel }
        });
        return { sub, payment };
      } else {
        const payment = await tx.payment.create({
          data: { schoolId: auth.user.schoolId!, amount, plan: parsed.data.plan, status: "PENDING", method: methodLabel }
        });
        const sub = await tx.subscription.findUnique({ where: { schoolId: auth.user.schoolId! } });
        return { sub, payment };
      }
    });

    return ok({ subscription: result.sub, payment: result.payment });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
