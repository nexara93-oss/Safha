"use client";

import { Suspense, useState, useEffect, FormEvent, useRef, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, X, School, MailCheck, RefreshCcw } from "lucide-react";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

function RegisterForm() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const { error, success } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const rawPlan = params.get("plan") || "";
  const allowedPlans = ["starter", "pro", "enterprise", "free"];
  const planParam = allowedPlans.includes(rawPlan) ? rawPlan : "";
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Prefill from Google OAuth redirect (?google=1&email=...&name=...)
  useEffect(() => {
    const isGoogle = params.get("google");
    const email = params.get("email");
    const name = params.get("name");
    if (isGoogle && email && !identifier) setIdentifier(email);
    if (isGoogle && name && !fullName) setFullName(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handleLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      error("Please upload an image file");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      error("Logo must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result));
    reader.readAsDataURL(f);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) errs.fullName = "Full name is required";
    if (schoolName.trim().length < 2) errs.schoolName = "School name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) errs.identifier = "Invalid email";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register({
        fullName: fullName.trim(),
        schoolName: schoolName.trim(),
        identifier: identifier.trim(),
        password,
        logoDataUrl: logoDataUrl || undefined
      });
      if (result.needsVerification) {
        setRegisteredEmail(result.email || identifier.trim());
        return;
      }
      success(`Welcome, ${fullName.split(" ")[0]}! Your school is ready.`);
      router.push("/dashboard/director");
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail })
      });
      if (res.ok) {
        success(t("auth.resendSent"));
      } else {
        const data = await res.json().catch(() => ({}));
        error(data?.error || t("auth.resendFailed"));
      }
    } catch {
      error(t("auth.resendFailed"));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout mode="register">
      <div>
        {registeredEmail ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-orange/10">
              <MailCheck className="h-8 w-8 text-brand-orange" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl dark:text-white">
              {t("auth.verifyEmail")}
            </h1>
            <p className="mt-3 text-sm text-brand-ink/70 dark:text-brand-paper/70">
              {t("auth.verifyEmailSub", { email: registeredEmail })}
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-8 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-ink transition-all hover:border-brand-orange hover:text-brand-orange disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-brand-paper"
            >
              {resending ? <Spinner /> : <RefreshCcw className="h-4 w-4" />}
              {t("auth.resendEmail")}
            </button>

            <p className="mt-6 text-sm text-brand-ink/70 dark:text-brand-paper/70">
              {t("common.alreadyAccount")}{" "}
              <Link href="/auth/login" className="font-semibold text-brand-orange hover:underline">
                {t("common.signin")}
              </Link>
            </p>
          </div>
        ) : (
          <>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl dark:text-white">
          {t("auth.createAccount")}
        </h1>
        <p className="mt-2 text-sm text-brand-ink/70 dark:text-brand-paper/70">
          {t("auth.createAccountSub")}
        </p>
        {planParam && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-semibold text-brand-orange">
            Plan selected: {planParam}
          </div>
        )}

        {params.get("google") && params.get("email") && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            Continue with Google — we&apos;ve prefilled your details. Just choose a password and school name.
          </div>
        )}

        <a
          href="/api/auth/google"
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-brand-ink shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          <GoogleIcon className="h-5 w-5" />
          {t("common.signupGoogle")}
        </a>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-brand-cream px-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:bg-[#0A0A0A] dark:text-white/40">
              {t("common.or")}
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">
              {t("common.fullName")}
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="M. Hassan El Amrani"
              className="input-field"
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="schoolName" className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">
              {t("common.schoolName")}
            </label>
            <input
              id="schoolName"
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="École Al-Andalous"
              className="input-field"
              aria-invalid={!!errors.schoolName}
            />
            {errors.schoolName && <p className="mt-1 text-xs text-red-500">{errors.schoolName}</p>}
          </div>

          <div>
            <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">
              {t("common.email")}
            </label>
            <input
              id="identifier"
              type="email"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="director@school.ma"
              className="input-field"
              aria-invalid={!!errors.identifier}
              autoComplete="email"
            />
            {errors.identifier && <p className="mt-1 text-xs text-red-500">{errors.identifier}</p>}
          </div>

          <div>
            <label htmlFor="reg-password" className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">
              {t("common.password")}
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPwd ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="input-field pe-11"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:text-brand-ink dark:hover:text-brand-paper"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                <EyeIcon visible={showPwd} className="h-4 w-4" />
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            <p className="mt-1 text-xs text-gray-500">Use 8+ characters with a mix of letters, numbers, and symbols.</p>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">
              {t("common.uploadLogo")} <span className="text-gray-400">(optional)</span>
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleLogo}
              className="hidden"
            />
            {!logoDataUrl ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm font-semibold text-brand-ink/70 transition-all hover:border-brand-orange hover:bg-brand-orange/5 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
              >
                <Upload className="h-4 w-4" /> {t("common.uploadLogo")}
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoDataUrl} alt="School logo" className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-ink dark:text-brand-paper">
                    <School className="h-4 w-4 text-brand-orange" /> Logo uploaded
                  </div>
                  <div className="text-xs text-gray-500">Click ✕ to remove</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLogoDataUrl(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-white/10"
                  aria-label="Remove logo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? <Spinner /> : t("common.signup")}
          </button>

          <p className="text-center text-xs text-gray-500">
            {t("hero.note")}
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-brand-ink/70 dark:text-brand-paper/70">
          {t("common.alreadyAccount")}{" "}
          <Link href="/auth/login" className="font-semibold text-brand-orange hover:underline">
            {t("common.signin")}
          </Link>
        </p>
        </>
        )}
      </div>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8 text-brand-orange" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
