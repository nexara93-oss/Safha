/**
 * Google OAuth entry point.
 *
 * In production, configure NextAuth or use `google-auth-library` with these env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI (= NEXT_PUBLIC_APP_URL + /api/auth/google/callback)
 *
 * The flow is intentionally left as a clean redirect target so the frontend's
 * "Sign in with Google" button can be wired up by adding the OAuth library of
 * your choice (NextAuth, Lucia, or `google-auth-library` directly).
 *
 * For demo/dev this route just returns a JSON message — wire it up before
 * deploying to production.
 */
import { NextRequest } from "next/server";
import { err } from "@/lib/api";

export async function GET(_req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return err(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env to enable.",
      501
    );
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return Response.redirect(url.toString(), 302);
}
