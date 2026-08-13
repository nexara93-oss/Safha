"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function AuthLayout({
  children,
  mode
}: {
  children: ReactNode;
  mode: "login" | "register";
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
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
      router.replace(target);
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-[#0A0A0A]">
      <div className="absolute inset-x-0 top-0 z-20 mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandLogo className="h-12 w-12" />
          <span className="font-display text-xl font-extrabold tracking-tight text-brand-ink dark:text-brand-paper">
            Safha
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Form side */}
        <div className="flex items-center justify-center px-4 pb-12 pt-24 sm:px-6 sm:pt-28 lg:px-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Visual side */}
        <div className="relative hidden overflow-hidden bg-black lg:block">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -top-40 -end-40 h-96 w-96 rounded-full bg-brand-orange/30 blur-3xl" />
            <div className="absolute -bottom-40 -start-40 h-96 w-96 rounded-full bg-brand-tan/25 blur-3xl" />
          </div>

          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {mode === "register" ? "Setup takes 2 minutes" : "Welcome back"}
              </div>
              <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight xl:text-5xl">
                {mode === "register"
                  ? "Set up your school in minutes."
                  : "Welcome back to Safha."}
              </h2>
              <p className="mt-4 max-w-md text-white/70">
                {mode === "register"
                  ? "Built for Moroccan private schools. Mobile-first, trilingual, and ready to replace your paper gradebook."
                  : "Continue managing your school with attendance, grades, and communication in one place."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-orange/20 text-2xl">
                  🇲🇦
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    "Safha transformed how we run our school. We replaced 3 notebooks in one week."
                  </p>
                  <p className="mt-2 text-xs text-white/60">— Mme. Bennani, Directrice, Casablanca</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { v: "2 400+", l: "écoles" },
                { v: "180k+", l: "élèves" },
                { v: "98%", l: "satisfaction" }
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <div className="font-display text-2xl font-extrabold">{s.v}</div>
                  <div className="text-xs text-white/60">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
