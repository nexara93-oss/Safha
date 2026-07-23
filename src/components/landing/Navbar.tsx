"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Menu, X, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardLink =
    user?.role === "DIRECTOR"
      ? "/dashboard/director"
      : user?.role === "TEACHER"
      ? "/dashboard/teacher"
      : user?.role === "STUDENT"
      ? "/dashboard/student"
      : user?.role === "ADMIN"
      ? "/dashboard/admin"
      : "/auth/login";

  return (
    <header
      data-scrolled={scrolled}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#09090b]/90 shadow-lg shadow-black/20 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-lg transition-transform group-hover:scale-105" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
            <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
              <path d="M32 14 L8 24 L32 34 L56 24 Z" fill="#FFFFFF" />
              <path d="M18 27.5 L18 36 C18 38.5 24 41 32 41 C40 41 46 38.5 46 36 L46 27.5 L32 34 Z" fill="#FFFFFF" />
              <path d="M52 24 L52 38" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="52" cy="40" r="1.6" fill="#FFFFFF" />
              <path d="M50.5 41.2 L51 46 M52 41.5 L52 46.5 M53.5 41.2 L53 46" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span data-nav-over-hero className="font-display text-xl font-extrabold tracking-tight text-white transition-colors">
            EduWave
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          <a
            data-nav-over-hero
            href="#features"
            className="text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            {t("nav.features")}
          </a>
          <a
            data-nav-over-hero
            href="#pricing"
            className="text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            {t("nav.pricing")}
          </a>
          <a
            data-nav-over-hero
            href="#about"
            className="text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            {t("nav.about")}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            data-nav-over-hero
            href={user ? dashboardLink : "/auth/login"}
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:text-white sm:inline-block"
          >
            {user ? user.fullName.split(" ")[0] : t("nav.signin")}
          </Link>
          <Link href="/auth/register" className="hidden sm:inline-flex btn-primary !py-2.5 !px-5 text-sm">
            {t("nav.start")}
          </Link>
          <button
            data-nav-over-hero
            onClick={() => setOpen((o) => !o)}
            className="rounded-xl p-2 text-white md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-[#09090b]/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            <a
              href="#features"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-semibold text-white/80 hover:bg-white/5"
            >
              {t("nav.features")}
            </a>
            <a
              href="#pricing"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-semibold text-white/80 hover:bg-white/5"
            >
              {t("nav.pricing")}
            </a>
            <a
              href="#about"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-semibold text-white/80 hover:bg-white/5"
            >
              {t("nav.about")}
            </a>
            <div className="my-2 border-t border-white/5" />
            <Link
              href={user ? dashboardLink : "/auth/login"}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-semibold text-white/80 hover:bg-white/5"
            >
              {user ? user.fullName.split(" ")[0] : t("nav.signin")}
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 w-full"
            >
              {t("nav.start")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
