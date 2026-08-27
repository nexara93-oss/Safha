import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";

function getBaseUrl(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  return req.nextUrl.origin;
}

function redirectWithError(req: NextRequest, code: string, httpStatus = 302) {
  const base = getBaseUrl(req);
  const url = new URL("/auth/login", base);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url.toString(), httpStatus);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  // User denied consent on Google side
  if (error) {
    console.error("[google/callback] Google returned error", error, "full URL:", req.nextUrl.toString());
    return redirectWithError(req, "google_denied");
  }

  if (!code) {
    console.error(
      "[google/callback] missing code — full URL:",
      req.nextUrl.toString(),
      "search:",
      req.nextUrl.search,
      "cookies:",
      req.cookies.getAll().map((c) => c.name).join(",")
    );
    return redirectWithError(req, "google_missing_code");
  }

  // Verify CSRF state
  const expectedState = req.cookies.get("g_state")?.value;
  if (expectedState && state !== expectedState) {
    return redirectWithError(req, "google_state_mismatch");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return redirectWithError(req, "google_not_configured");
  }

  try {
    // Exchange code for tokens
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

    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => "");
      console.error("[google/callback] token exchange failed", tokenRes.status, body);
      return redirectWithError(req, "google_token_failed");
    }

    const tokens = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
    };

    if (!tokens.access_token && !tokens.id_token) {
      return redirectWithError(req, "google_no_token");
    }

    // Prefer id_token if available, otherwise use access_token + userinfo
    let email: string | undefined;
    let name: string | undefined;
    let verified: boolean | undefined;

    if (tokens.id_token) {
      try {
        // Decode without verification — we still call userinfo for trust,
        // but id_token gives us email quickly for the redirect path
        const payload = JSON.parse(
          Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
        ) as { email?: string; name?: string; email_verified?: boolean };
        email = payload.email;
        name = payload.name;
        verified = payload.email_verified;
      } catch {
        // ignore, fallback to userinfo
      }
    }

    // Always fetch userinfo with access_token when available for verification
    if (tokens.access_token) {
      const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (!infoRes.ok) {
        console.error("[google/callback] userinfo failed", infoRes.status);
        return redirectWithError(req, "google_userinfo_failed");
      }
      const info = (await infoRes.json()) as {
        sub: string;
        email: string;
        email_verified?: boolean;
        verified_email?: boolean;
        name?: string;
        picture?: string;
      };
      email = info.email || email;
      name = info.name || name;
      verified = info.email_verified ?? info.verified_email ?? verified;
    }

    if (!email) {
      return redirectWithError(req, "google_no_email");
    }

    // Google should have verified the email; if not, send user to register manually
    if (verified === false) {
      const url = new URL("/auth/login", baseUrl);
      url.searchParams.set("error", "google_email_not_verified");
      return NextResponse.redirect(url.toString());
    }

    email = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email },
      include: { school: true }
    });

    if (!user) {
      // No account yet — send to register with prefilled data
      const params = new URLSearchParams({
        google: "1",
        email,
        name: name || ""
      });
      const url = new URL(`/auth/register?${params.toString()}`, baseUrl);
      const res = NextResponse.redirect(url.toString());
      res.cookies.delete("g_state");
      return res;
    }

    if (user.status !== "ACTIVE") {
      const url = new URL("/auth/login", baseUrl);
      url.searchParams.set("error", "account_inactive");
      const res = NextResponse.redirect(url.toString());
      res.cookies.delete("g_state");
      return res;
    }

    const token = signToken({
      userId: user.id,
      role: user.role as "DIRECTOR" | "TEACHER" | "STUDENT" | "ADMIN",
      schoolId: user.schoolId
    });
    await setAuthCookie(token);

    const target =
      user.role === "DIRECTOR"
        ? "/dashboard/director"
        : user.role === "TEACHER"
          ? "/dashboard/teacher"
          : user.role === "STUDENT"
            ? "/dashboard/student"
            : user.role === "ADMIN"
              ? "/dashboard/admin"
              : "/";

    const res = NextResponse.redirect(`${baseUrl}${target}`);
    res.cookies.delete("g_state");
    return res;
  } catch (e) {
    console.error("[google/callback] unexpected error", e);
    return redirectWithError(req, "google_callback_failed");
  }
}
