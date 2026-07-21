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
  register: (data: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
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

const USER_KEY = "eduwave_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const persistUser = useCallback((u: AuthUser | null) => {
    if (typeof window === "undefined") return;
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
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

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await fetch("/api/auth/login", {
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
    const data = (await res.json()) as { user: AuthUser; token?: string };
    setUser(data.user);
    persistUser(data.user);
    return data.user;
  }, [persistUser]);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      window.location.href = "/api/auth/logout";
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
