import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, err, parseJson, zodToErrorResponse } from "@/lib/api";
import { buildVerificationEmail, generateVerificationToken, hashToken, sendEmail, APP_URL } from "@/lib/email";

const schema = z.object({
  email: z.string().email()
});

const rateMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const last = rateMap.get(ip) || 0;
  if (now - last < 60000) {
    return err("Please wait a moment before resending", 429);
  }
  rateMap.set(ip, now);

  try {
    const body = await parseJson(req, schema);
    const email = body.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return err("No account found with this email", 404);
    if (user.emailVerified) return err("This email is already verified", 400);

    const raw = generateVerificationToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashToken(raw),
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    const verifyUrl = `${APP_URL}/auth/verify-email?token=${raw}`;
    const mail = buildVerificationEmail({
      name: user.fullName.split(" ")[0],
      url: verifyUrl
    });
    const sent = await sendEmail({ to: email, subject: mail.subject, html: mail.html });
    if (!sent.ok) return err("Failed to send verification email. Please try again later.", 500);

    return ok({ ok: true });
  } catch (e) {
    return zodToErrorResponse(e);
  }
}
