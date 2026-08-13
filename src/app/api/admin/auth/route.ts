import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { signToken, setAuthCookie, type AuthClaims } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { checkRateLimit, getClientIP, isAccountLocked, recordFailedAttempt, clearFailedAttempts } from "@/lib/rate-limit";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required");
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rateLimit = checkRateLimit(`admin:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return err("Too many attempts. Please try again later.", 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) return err("Username and password required", 400);

    const lockKey = `admin:${username}`;
    const lock = isAccountLocked(lockKey);
    if (lock.locked) {
      return err(`Admin account temporarily locked. Try again in ${lock.retryAfter} seconds.`, 429);
    }

    if (!safeEqual(username, ADMIN_USERNAME) || !safeEqual(password, ADMIN_PASSWORD)) {
      recordFailedAttempt(lockKey);
      return err("Invalid credentials", 401);
    }

    clearFailedAttempts(lockKey);

    let adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });

    if (!adminUser) {
      const { hashPassword } = await import("@/lib/db");
      const pwHash = await hashPassword(ADMIN_PASSWORD);
      adminUser = await prisma.user.create({
        data: {
          fullName: "Admin",
          email: "admin@safha.com",
          phone: "0000000000",
          passwordHash: pwHash,
          role: "ADMIN",
          status: "ACTIVE"
        }
      });
    }

    const token = signToken({
      userId: adminUser.id,
      role: "ADMIN" as AuthClaims["role"],
      schoolId: null
    });
    await setAuthCookie(token);

    return ok({ token, userId: adminUser.id });
  } catch (e) {
    console.error("[admin/auth]", e);
    return err("Internal error", 500);
  }
}
