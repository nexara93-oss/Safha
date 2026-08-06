import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signToken, setAuthCookie, type AuthClaims } from "@/lib/auth";
import { hashToken } from "@/lib/email";
import { ok, err } from "@/lib/api";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("token");
  if (!raw) return err("Missing verification token", 400);

  const tokenHash = hashToken(raw);
  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: tokenHash },
    include: { school: { select: { id: true, name: true, logoUrl: true } } }
  });

  if (!user) return err("Invalid or expired verification link", 400);

  if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
    return err(
      "Verification link has expired. Please request a new one.",
      400,
      { code: "VERIFICATION_EXPIRED", email: user.email }
    );
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        status: "ACTIVE",
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });
  }

  const token = signToken({
    userId: user.id,
    role: user.role as AuthClaims["role"],
    schoolId: user.schoolId
  });
  await setAuthCookie(token);

  return ok({
    verified: true,
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
}
