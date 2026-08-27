import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { err } from "@/lib/api";

/**
 * Google OAuth entry point.
 *
 * Required env vars (see .env / .env.example):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   NEXT_PUBLIC_APP_URL  (e.g. http://localhost:3001)
 *
 * Setup:
 *   1) https://console.cloud.google.com/apis/credentials
 *   2) Create OAuth 2.0 Client ID (Web application)
 *   3) Authorized redirect URI = <NEXT_PUBLIC_APP_URL>/api/auth/google/callback
 */

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !clientId.trim()) {
    return err(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env to enable. See .env.example for instructions.",
      501
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || req.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/google/callback`;

  // CSRF protection — random state stored in httpOnly cookie
  const state = crypto.randomBytes(16).toString("hex");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  console.log("[google] redirect_uri:", redirectUri, "| full URL:", url.toString());
  const res = NextResponse.redirect(url.toString(), 302);
  res.cookies.set("g_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600 // 10 min
  });
  return res;
}
