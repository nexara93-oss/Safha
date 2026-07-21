import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma, verifyPassword } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import { ok, err, parseJson, zodToErrorResponse } from "@/lib/api";
import { checkRateLimit, getClientIP, isAccountLocked, recordFailedAttempt, clearFailedAttempts } from "@/lib/rate-limit";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

const schema = z.object({
  identifier: z.string().min(2),
  password: z.string().min(1)
});

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rateLimit = checkRateLimit(`student-login:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return err("Too many login attempts. Please try again later.", 429);
  }

  try {
    const body = await parseJson(req, schema);
    const identifier = body.identifier.trim();
    const isEmailInput = isEmail(identifier);
    const lockKey = isEmailInput ? identifier : identifier.toLowerCase();

    const lock = isAccountLocked(`student:${lockKey}`);
    if (lock.locked) {
      return err(`Account temporarily locked. Try again in ${lock.retryAfter} seconds.`, 429);
    }

    const includeSchool = { school: { select: { id: true, name: true, logoUrl: true } } };
    let user;
    if (isEmailInput) {
      user = await prisma.user.findFirst({
        where: { email: identifier, role: "STUDENT", status: "ACTIVE" },
        include: includeSchool
      });
    } else {
      user = await prisma.user.findFirst({
        where: { fullName: identifier, role: "STUDENT", status: "ACTIVE" },
        include: includeSchool
      });
      if (!user) {
        user = await prisma.user.findFirst({
          where: { email: identifier, role: "STUDENT", status: "ACTIVE" },
          include: includeSchool
        });
      }
    }
    if (!user) {
      recordFailedAttempt(`student:${lockKey}`);
      return err("Student not found. Check your email/name with your teacher.", 404);
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      recordFailedAttempt(`student:${lockKey}`);
      return err("Incorrect password", 401);
    }

    clearFailedAttempts(`student:${lockKey}`);

    const token = signToken({
      userId: user.id,
      role: "STUDENT",
      schoolId: user.schoolId
    });
    await setAuthCookie(token);

    return ok({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: "STUDENT",
        schoolId: user.schoolId,
        school: user.school
      }
    });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
