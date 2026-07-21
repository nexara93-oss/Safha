"use client";

import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { useDashboard } from "./DashboardShell";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function Topbar() {
  const { user, logout } = useAuth();
  const { t, dir } = useLanguage();
  const router = useRouter();
  const { setSidebarOpen } = useDashboard();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/85 backdrop-blur-md dark:border-white/5 dark:bg-brand-navy/85">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:px-8 rtl:flex-row-reverse">
        <div className="flex items-center gap-3 rtl:flex-row-reverse">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-brand-ink hover:bg-gray-100 lg:hidden dark:text-white dark:hover:bg-white/5"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-brand-ink dark:text-brand-paper">
              {user?.school?.name ? user.school.name : "EduWave"}
            </h1>
            <p className="text-xs text-brand-ink/60 dark:text-brand-paper/60">
              {user?.role === "DIRECTOR" ? t("auth.welcomeDirector") : user?.role === "TEACHER" ? t("auth.welcomeTeacher") : user?.role === "ADMIN" ? t("auth.welcomeAdmin") : user?.role === "PARENT" ? t("auth.welcomeParent") : t("auth.welcomeStudent")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rtl:flex-row-reverse">
          <LanguageSwitcher />
          <ThemeToggle />
          <NotificationBell />
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-ink transition-colors hover:text-brand-orange dark:text-white dark:hover:text-brand-orange"
              aria-expanded={open}
            >
              {user?.fullName?.split(" ")[0] || "User"}
            </button>
            {open && (
              <div className={`absolute z-50 mt-2 w-56 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-brand-navy ${
                dir === "rtl" ? "left-0 origin-top-left" : "right-0 origin-top-right"
              }`}>
                <div className="border-b border-gray-100 px-4 py-3 dark:border-white/5">
                  <div className="text-sm font-bold text-brand-ink dark:text-brand-paper">{user?.fullName}</div>
                  <div className="truncate text-xs text-gray-500">{user?.email || user?.phone}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  {t("common.signout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
