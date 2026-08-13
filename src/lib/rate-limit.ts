import { createHash } from "crypto";

type Entry = { count: number; resetAt: number; maxFailures?: number };

const store = new Map<string, Entry>();

const MAX_FAILURES = 5;

const TRUST_PROXY = process.env.TRUST_PROXY === "true";

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function isAccountLocked(identifier: string): { locked: boolean; retryAfter: number } {
  const key = `lockout:${identifier}`;
  const entry = store.get(key);
  if (entry && entry.count >= (entry.maxFailures ?? MAX_FAILURES) && Date.now() < entry.resetAt) {
    return { locked: true, retryAfter: Math.ceil((entry.resetAt - Date.now()) / 1000) };
  }
  return { locked: false, retryAfter: 0 };
}

export function recordFailedAttempt(identifier: string, maxFailures = MAX_FAILURES, lockoutMs = 15 * 60 * 1000) {
  const key = `lockout:${identifier}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + lockoutMs, maxFailures });
    return;
  }

  entry.count += 1;
}

export function clearFailedAttempts(identifier: string) {
  store.delete(`lockout:${identifier}`);
}

export function getClientIP(req: Request): string {
  if (TRUST_PROXY) {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return hashRequest(req);
}

function hashRequest(req: Request): string {
  const src = [
    req.url,
    req.headers.get("user-agent") ?? "",
    req.headers.get("accept-language") ?? "",
    req.headers.get("sec-ch-ua") ?? "",
    req.headers.get("accept") ?? ""
  ].join("|");
  return createHash("sha256").update(src).digest("hex").slice(0, 32);
}
