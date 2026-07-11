import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helper to wrap route errors with helpful context
export function describePrismaError(e: unknown): string {
  if (e instanceof Error) {
    const msg = e.message;
    if (msg.includes("Environment variable not found: DATABASE_URL")) {
      return "DATABASE_URL is not set in .env. Add your Postgres connection string and restart the dev server.";
    }
    if (msg.includes("Can't reach database server")) {
      return "Cannot reach the database. Check that Postgres is running and DATABASE_URL is correct.";
    }
    if (msg.includes("does not exist") || msg.includes("relation") && msg.includes("does not exist")) {
      return "Database tables are missing. Run: npx prisma migrate dev";
    }
    if (msg.includes("Authentication failed")) {
      return "Database authentication failed. Check DATABASE_URL credentials.";
    }
    return msg;
  }
  return "Unknown database error";
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Generate a strong 10-character password.
 * Format: 4 lowercase + 2 uppercase + 2 digits + 2 symbols (rearranged for uniqueness).
 * Guarantees unique across the school's teachers (caller checks).
 */
export function generateStrongPassword(): string {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%&*?+=";

  const pick = (s: string) => s[crypto.randomInt(s.length)];
  const arr = [
    pick(lower),
    pick(lower),
    pick(lower),
    pick(upper),
    pick(upper),
    pick(digits),
    pick(digits),
    pick(symbols),
    pick(symbols),
    pick(lower)
  ];
  // Shuffle (Fisher-Yates) using crypto
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

export function generateTeacherEmail(firstName: string, lastName: string, schoolName: string): string {
  const slug = schoolName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "school";
  const first = firstName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  const last = lastName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
  return `${first}.${last}@${slug}.gmail.com`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
