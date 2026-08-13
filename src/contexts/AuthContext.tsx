"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Role = "DIRECTOR" | "TEACHER" | "STUDENT" | "ADMIN";

export type AuthUser = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  schoolId?: string | null;
  school?: { id: string; name: string; logoUrl?: string | null } | null;
  language?: string;
  theme?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  loginStudent: (identifier: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterPayload) => Promise<RegisterResult>;
  logout: () => void;
  refresh: () => Promise<void>;
};

type RegisterResult = {
  user: AuthUser | null;
  needsVerification: boolean;
  email?: string | null;
};

type RegisterPayload = {
  fullName: string;
  schoolName: string;
  identifier: string;
  password: string;
  logoDataUrl?: string;
  adminCode?: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "safha_user";
const AUTH_COOKIE_NAME = "safha_token";

function clearSessionCookie() {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const persistUser = useCallback((u: AuthUser | null) => {
    if (typeof window === "undefined") return;
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify({ role: u.role }));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (res.ok) {
        const data = (await res.json()) as { user: AuthUser };
        setUser(data.user);
        persistUser(data.user);
      } else {
        setUser(null);
        localStorage.removeItem(USER_KEY);
        if (res.status === 401) clearSessionCookie();
      }
    } catch {
      setUser(null);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, [persistUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      localStorage.removeItem(USER_KEY);
      clearSessionCookie();
    };
    window.addEventListener("safha:unauthorized", onUnauthorized);
    return () => window.removeEventListener("safha:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ identifier, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.error || "Login failed") as Error & { code?: string; email?: string };
      if (err.code) e.code = err.code;
      if (err.email) e.email = err.email;
      throw e;
    }
    const data = (await res.json()) as { user: AuthUser; token?: string };
    setUser(data.user);
    persistUser(data.user);
    return data.user;
  }, [persistUser]);

  const loginStudent = useCallback(async (identifier: string, password: string) => {
    const res = await fetch("/api/auth/login-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ identifier, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }
    const data = (await res.json()) as { user: AuthUser; token?: string };
    setUser(data.user);
    persistUser(data.user);
    return data.user;
  }, [persistUser]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Registration failed");
    }
    const data = (await res.json()) as { user?: AuthUser | null; needsVerification?: boolean; email?: string | null };
    if (data.user) {
      setUser(data.user);
      persistUser(data.user);
    }
    return {
      user: data.user ?? null,
      needsVerification: !!data.needsVerification,
      email: data.email
    };
  }, [persistUser]);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!res.ok) throw new Error(`Logout failed (${res.status})`);
    } catch {
      try {
        const res = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
        if (!res.ok) throw new Error(`Logout failed (${res.status})`);
      } catch {
        clearSessionCookie();
        window.location.href = "/auth/login";
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginStudent, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
