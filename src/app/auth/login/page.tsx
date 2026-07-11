"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { AuthLayout } from "@/components/auth/AuthLayout";

function LoginForm() {
  const { t } = useLanguage();
  const { login, loginStudent } = useAuth();
  const { error, success } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const rawMode = params.get("mode");
  const initialMode: "director" | "student" = rawMode === "student" ? "student" : "director";
  const [mode, setMode] = useState<"director" | "student">(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [studentName, setStudentName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === "director" && !identifier.trim()) {
      error("Please enter your email or phone");
      return;
    }
    if (mode === "student" && !studentName.trim()) {
      error("Please enter your email or name");
      return;
    }
    if (!password) {
      error("Please enter your password");
      return;
    }
    setLoading(true);
    try {
      const user =
        mode === "director"
          ? await login(identifier.trim(), password)
          : await loginStudent(studentName.trim(), password);
      success(`Welcome, ${user.fullName}!`);
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
      router.push(target);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl dark:text-white">
          {t("auth.welcomeBack")}
        </h1>
        <p className="mt-2 text-sm text-brand-ink/70 dark:text-brand-paper/70">
          {t("auth.welcomeBackSub")}
        </p>

        <div className="mt-6 inline-flex rounded-2xl bg-gray-100 p-1 dark:bg-white/5">
          {(["director", "student"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-white text-brand-ink shadow-sm dark:bg-brand-navy dark:text-white"
                  : "text-brand-ink/60 dark:text-brand-paper/60"
              }`}
            >
              {m === "director" ? t("auth.welcomeDirector") : t("auth.welcomeStudent")}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {mode === "director" ? (
            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">
                {t("common.email")} / {t("common.phone")}
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="director@school.ma"
                  className="input-field ps-11"
                />
                <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="studentName" className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">
                {t("common.email")} / {t("common.fullName")}
              </label>
              <input
                id="studentName"
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="student@eduwave.ma"
                className="input-field"
              />
              <p className="mt-1 text-xs text-gray-500">Enter your email or full name.</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">
              {t("common.password")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                required
                minLength={1}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pe-11"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-brand-paper"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {mode === "student" && (
              <p className="mt-1 text-xs text-gray-500">
                Ask your teacher for your email and password.
              </p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? <Spinner /> : t("common.signin")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-ink/70 dark:text-brand-paper/70">
          {t("common.newHere")}{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-brand-orange hover:underline"
          >
            {t("common.signup")}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8 text-brand-orange" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
