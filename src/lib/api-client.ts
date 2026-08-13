"use client";

/**
 * Tiny fetch wrapper that relies on httpOnly cookies for auth
 * and throws a friendly Error on non-2xx responses.
 */
export async function api<T = unknown>(
  url: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined)
  };

  let body = init?.body;
  if (init?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }

  const res = await fetch(url, {
    ...init,
    body,
    headers,
    credentials: "same-origin"
  });
  if (res.status === 401) notifyUnauthorized();
  const text = await res.text();
  const data = text ? safeParse(text) : null;
  if (!res.ok) {
    let msg: string;
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      (data as { error: unknown }).error != null
    ) {
      const raw = String((data as { error: unknown }).error);
      msg = raw && raw !== "null" && raw !== "undefined" ? raw : `Request failed (${res.status})`;
    } else {
      msg = `Request failed (${res.status})`;
    }
    throw new Error(msg);
  }
  if (data === null) throw new Error("Invalid server response");
  return data as T;
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

let lastUnauthorizedAt = 0;

function notifyUnauthorized() {
  const now = Date.now();
  if (now - lastUnauthorizedAt < 5000) return;
  lastUnauthorizedAt = now;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("safha:unauthorized", { detail: { status: 401 } }));
  }
}
