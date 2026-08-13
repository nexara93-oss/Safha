import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";

const COOKIE = "safha_token";

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET environment variable is required");
  return s;
}

export type Role = "DIRECTOR" | "TEACHER" | "STUDENT" | "PARENT" | "ADMIN";

export type AuthClaims = {
  userId: string;
  role: Role;
  schoolId: string | null;
};

export function signToken(claims: AuthClaims): string {
  return jwt.sign(claims, getJwtSecret(), { expiresIn: "24h" });
}

export function verifyToken(token: string): AuthClaims | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as AuthClaims;
    return decoded;
  } catch {
    return null;
  }
}

export async function getAuthFromRequest(req: NextRequest): Promise<{
  claims: AuthClaims;
  user: NonNullable<Awaited<ReturnType<typeof getUserById>>>;
} | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const claims = verifyToken(token);
  if (!claims) return null;
  const user = await getUserById(claims.userId);
  if (!user) return null;
  if (user.status !== "ACTIVE") return null;
  return { claims, user };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { school: { select: { id: true, name: true, logoUrl: true } } }
  });
}

export async function setAuthCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/"
  });
}

export async function clearAuthCookie() {
  (await cookies()).delete(COOKIE);
}

export const AUTH_COOKIE_NAME = COOKIE;
