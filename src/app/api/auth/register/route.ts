import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma, hashPassword, describePrismaError } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { signToken, setAuthCookie, type AuthClaims } from "@/lib/auth";
import { ok, err, parseJson, zodToErrorResponse } from "@/lib/api";
import { buildVerificationEmail, generateVerificationToken, hashToken, sendEmail, APP_URL } from "@/lib/email";

const schema = z.object({
  fullName: z.string().min(2).max(120),
  schoolName: z.string().min(2).max(120),
  identifier: z.string().min(3),
  password: z.string().min(8).max(128),
  logoDataUrl: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        if (!/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(val)) return false;
        try {
          const base64 = val.slice(val.indexOf(",") + 1);
          return Buffer.from(base64, "base64").length < 300 * 1024;
        } catch {
          return false;
        }
      },
      { message: "Logo must be a data URL (png/jpeg/webp/svg) under 300KB" }
    )
});

const rateMap = new Map<string, { count: number; reset: number }>();

function rateLimit(key: string, limit = 5) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + 60000 });
    return true;
  }
  if (entry.count++ >= limit) return false;
  return true;
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(request: NextRequest) {
  if (process.env.REGISTRATION_ENABLED !== "true") {
    return err("Registration is currently closed", 403);
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`register:${ip}`, 5)) {
    return Response.json({ error: "Too fast" }, { status: 429 });
  }

  try {
    const body = await parseJson(request, schema);

    const isEmailInput = isEmail(body.identifier);
    const passwordHash = await hashPassword(body.password);

    const exists = await prisma.user.findUnique({
      where: isEmailInput ? { email: body.identifier } : { phone: body.identifier }
    });
    if (exists) return err("An account already exists with this information", 409);

    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: body.fullName,
          email: isEmailInput ? body.identifier : null,
          phone: isEmailInput ? null : body.identifier,
          passwordHash,
          role: "DIRECTOR",
          ...(isEmailInput
            ? {
                status: "PENDING_VERIFICATION",
                emailVerificationToken: hashToken(verificationToken),
                emailVerificationExpires: verificationExpiry
              }
            : {})
        }
      });

      const school = await tx.school.create({
        data: {
          name: body.schoolName,
          logoUrl: body.logoDataUrl || null,
          directorId: user.id
        }
      });

      await tx.user.update({
        where: { id: user.id },
        data: { schoolId: school.id }
      });

      const start = new Date();
      const end = new Date(start.getTime() + 15 * 24 * 60 * 60 * 1000);
      await tx.subscription.create({
        data: {
          schoolId: school.id,
          plan: "FREE_TRIAL",
          startDate: start,
          endDate: end
        }
      });

      return { user, school };
    });

    if (isEmailInput) {
      const verifyUrl = `${APP_URL}/auth/verify-email?token=${verificationToken}`;
      const mail = buildVerificationEmail({
        name: result.user.fullName.split(" ")[0],
        url: verifyUrl
      });
      const sent = await sendEmail({ to: body.identifier, subject: mail.subject, html: mail.html });

      return ok({
        user: null,
        needsVerification: true,
        email: result.user.email,
        emailSent: sent.ok
      });
    }

    const token = signToken({
      userId: result.user.id,
      role: "DIRECTOR" as AuthClaims["role"],
      schoolId: result.school.id
    });
    await setAuthCookie(token);

    return ok({
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone,
        role: "DIRECTOR",
        schoolId: result.school.id,
        school: { id: result.school.id, name: result.school.name, logoUrl: result.school.logoUrl }
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[register] prisma error:", e);
      return err(describePrismaError(e), 500);
    }
    return zodToErrorResponse(e);
  }
}
