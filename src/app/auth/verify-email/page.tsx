"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, MailWarning, RefreshCcw, Loader2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useLanguage } from "@/contexts/LanguageContext";

import { Spinner } from "@/components/ui/Spinner";

type State = "loading" | "success" | "invalid" | "expired";

function VerifyContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          credentials: "same-origin"
        });
        if (res.ok) {
          setState("success");
        } else {
          const data = await res.json().catch(() => ({}));
          if (data?.code === "VERIFICATION_EXPIRED") {
            setEmail(data?.email || "");
            setState("expired");
          } else {
            setState("invalid");
          }
        }
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  useEffect(() => {
    if (state !== "success") return;
    const timer = setTimeout(() => router.push("/dashboard/director"), 2000);
    return () => clearTimeout(timer);
  }, [state, router]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setState("expired");
        alert(t("auth.resendSent"));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || t("auth.resendFailed"));
      }
    } catch {
      alert(t("auth.resendFailed"));
    } finally {
      setResending(false);
    }
  };

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

      <div className="flex min-h-screen items-center justify-center px-4 pb-12 pt-28">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
          {state === "loading" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-orange/10">
                <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
              </div>
              <h1 className="mt-6 font-display text-2xl font-extrabold text-brand-ink dark:text-white">
                {t("auth.verifying")}
              </h1>
            </>
          )}

          {state === "success" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <MailCheck className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="mt-6 font-display text-2xl font-extrabold text-brand-ink dark:text-white">
                {t("auth.verifySuccess")}
              </h1>
              <Link
                href="/dashboard/director"
                className="mt-8 inline-block w-full rounded-xl bg-brand-orange px-5 py-3 text-sm font-bold text-white transition-all hover:bg-brand-orange/90"
              >
                {t("auth.verifyGoToDashboard")}
              </Link>
            </>
          )}

          {state === "invalid" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                <MailWarning className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="mt-6 font-display text-2xl font-extrabold text-brand-ink dark:text-white">
                {t("auth.verifyInvalid")}
              </h1>
              <Link
                href="/auth/login"
                className="mt-8 inline-block w-full rounded-xl bg-brand-orange px-5 py-3 text-sm font-bold text-white transition-all hover:bg-brand-orange/90"
              >
                {t("common.signin")}
              </Link>
            </>
          )}

          {state === "expired" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                <MailWarning className="h-8 w-8 text-amber-500" />
              </div>
              <h1 className="mt-6 font-display text-2xl font-extrabold text-brand-ink dark:text-white">
                {t("auth.verifyExpired")}
              </h1>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange px-5 py-3 text-sm font-bold text-white transition-all hover:bg-brand-orange/90 disabled:opacity-50"
              >
                {resending ? <Spinner /> : <RefreshCcw className="h-4 w-4" />}
                {t("auth.resendEmail")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8 text-brand-orange" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
