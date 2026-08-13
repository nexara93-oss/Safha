import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma, verifyPassword, describePrismaError } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { signToken, setAuthCookie, type AuthClaims } from "@/lib/auth";
import { ok, err, parseJson, zodToErrorResponse } from "@/lib/api";
import { checkRateLimit, getClientIP, isAccountLocked, recordFailedAttempt, clearFailedAttempts } from "@/lib/rate-limit";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Valid bcrypt hash of a throwaway string, used to equalize timing for unknown accounts.
const DUMMY_HASH = "$2a$12$vGGSDmj.Dz1Pp/vRFV.fauy/HzVxUg7BKzd0cAOGYx/5Q.8ZhpjVu";

const schema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1)
});

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rateLimit = checkRateLimit(`login:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return err("Too many login attempts. Please try again later.", 429);
  }

  try {
    const body = await parseJson(req, schema);
    const isEmailInput = isEmail(body.identifier);
    const identifier = body.identifier.toLowerCase().trim();

    const lock = isAccountLocked(identifier);
    if (lock.locked) {
      return err(`Account temporarily locked. Try again in ${lock.retryAfter} seconds.`, 429);
    }

    const user = await prisma.user.findFirst({
      where: isEmailInput ? { email: identifier } : { phone: identifier },
      include: { school: { select: { id: true, name: true, logoUrl: true } }, teacher: true, student: true }
    });
    if (!user) {
      await verifyPassword(body.password, DUMMY_HASH);
      recordFailedAttempt(identifier);
      return err("Invalid credentials", 401);
    }
    if (user.status === "PENDING_VERIFICATION") {
      return err("Please verify your email before signing in.", 403, {
        code: "EMAIL_NOT_VERIFIED",
        email: user.email
      });
    }
    if (user.status !== "ACTIVE") return err("Account suspended", 403);
    if (user.role === "STUDENT") return err("Students must use the student login form", 400);

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      recordFailedAttempt(identifier);
      return err("Invalid credentials", 401);
    }

    clearFailedAttempts(identifier);

    const token = signToken({
      userId: user.id,
      role: user.role as AuthClaims["role"],
      schoolId: user.schoolId
    });
    await setAuthCookie(token);

    return ok({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        schoolId: user.schoolId,
        school: user.school
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[login] prisma error:", e);
      return err(describePrismaError(e), 500);
    }
    return zodToErrorResponse(e);
  }
}
