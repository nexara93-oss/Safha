import nodemailer from "nodemailer";
import { createHash, randomBytes } from "crypto";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn(
      "[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — verification emails are disabled."
    );
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
}

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, error: "Email not configured" };
  const from = process.env.GMAIL_USER || "Safha";
  try {
    await transporter.sendMail({ from: `Safha <${from}>`, to, subject, html });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown email error";
    console.error("[email] sendMail failed:", error);
    return { ok: false, error };
  }
}

export function buildVerificationEmail({ name, url }: { name: string; url: string }) {
  return {
    subject: "Verify your email — Safha",
    html: `
      <div style="background:#FAFAFA;padding:32px;font-family:Inter,Arial,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #ECECEC;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
            <div style="width:36px;height:36px;border-radius:10px;background:#2A4DFF;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;">S</div>
            <span style="font-weight:800;font-size:20px;color:#0A0A0A;">Safha</span>
          </div>
          <h1 style="color:#0A0A0A;font-size:22px;margin:0 0 8px;">Hi ${name},</h1>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Thanks for signing up! Please confirm your email address to activate your Safha account.
          </p>
          <a href="${url}" style="display:inline-block;background:#2A4DFF;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:12px 28px;border-radius:12px;">
            Verify my email
          </a>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:24px 0 0;">
            Or copy this link into your browser:<br/>
            <span style="color:#2A4DFF;word-break:break-all;">${url}</span>
          </p>
          <p style="color:#aaa;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
            If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `
  };
}
