"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";
import { EyeIcon } from "@/components/ui/EyeIcon";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Invalid credentials");
      }
      router.push("/dashboard/admin");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-orange-600 shadow-lg shadow-brand-orange/20">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white">Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-400">Safha Platform Management</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-300">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <EyeIcon visible={showPwd} className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-orange/20 transition-all hover:shadow-xl hover:shadow-brand-orange/30 disabled:opacity-50">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Sign in
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Safha. All rights reserved.
        </p>
      </div>
    </div>
  );
}
