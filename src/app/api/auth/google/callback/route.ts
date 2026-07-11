import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code) return err("Missing code", 400);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
  if (!clientId || !clientSecret) return err("OAuth not configured", 501);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
  if (!tokenRes.ok) return err("Token exchange failed", 400);
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return err("No access token", 400);

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  if (!infoRes.ok) return err("Userinfo failed", 400);
  const info = (await infoRes.json()) as { sub: string; email: string; name?: string };

  let user = await prisma.user.findUnique({ where: { email: info.email }, include: { school: true } });
  if (!user) {
    const params = new URLSearchParams({ email: info.email, name: info.name || "" });
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/register?google=1&${params.toString()}`);
  }

  const token = signToken({
    userId: user.id,
    role: user.role as "DIRECTOR" | "TEACHER" | "STUDENT" | "ADMIN",
    schoolId: user.schoolId
  });
  await setAuthCookie(token);

  const target =
    user.role === "DIRECTOR" ? "/dashboard/director"
    : user.role === "TEACHER" ? "/dashboard/teacher"
    : user.role === "STUDENT" ? "/dashboard/student"
    : user.role === "ADMIN" ? "/dashboard/admin"
    : "/";
  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${target}`);
}
