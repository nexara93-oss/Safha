type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

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
  if (entry && Date.now() < entry.resetAt) {
    return { locked: true, retryAfter: Math.ceil((entry.resetAt - Date.now()) / 1000) };
  }
  return { locked: false, retryAfter: 0 };
}

export function recordFailedAttempt(identifier: string, maxFailures = 5, lockoutMs = 15 * 60 * 1000) {
  const key = `lockout:${identifier}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + lockoutMs });
    return;
  }

  entry.count += 1;

  if (entry.count >= maxFailures) {
    entry.resetAt = now + lockoutMs;
    entry.count = maxFailures;
  }
}

export function clearFailedAttempts(identifier: string) {
  store.delete(`lockout:${identifier}`);
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
