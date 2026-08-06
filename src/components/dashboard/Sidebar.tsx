"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  MessageSquare,
  CreditCard,
  BookOpen,
  FileText,
  CalendarCheck,
  Heart,
  ShieldCheck,
  X,
  LogOut,
  Clock,
  Bell,
  BarChart3
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useDashboard } from "./DashboardShell";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const navByRole = {
  DIRECTOR: [
    { href: "/dashboard/director", icon: LayoutDashboard, key: "dashboard.overview" },
    { href: "/dashboard/director/teachers", icon: Users, key: "dashboard.teachers" },
    { href: "/dashboard/director/students", icon: GraduationCap, key: "dashboard.students" },
    { href: "/dashboard/director/analytics", icon: BarChart3, key: "dashboard.analytics" },
    { href: "/dashboard/director/messages", icon: MessageSquare, key: "dashboard.messages" },
    { href: "/dashboard/director/payment", icon: CreditCard, key: "dashboard.payment" },
    { href: "/dashboard/director/notifications", icon: Bell, key: "dashboard.notifications" }
  ],
  TEACHER: [
    { href: "/dashboard/teacher", icon: LayoutDashboard, key: "dashboard.overview" },
    { href: "/dashboard/teacher/lessons", icon: BookOpen, key: "dashboard.lessons" },
    { href: "/dashboard/teacher/exams", icon: FileText, key: "dashboard.exams" },
    { href: "/dashboard/teacher/sections", icon: BookOpen, key: "dashboard.sections" },
    { href: "/dashboard/teacher/students", icon: GraduationCap, key: "dashboard.students" },
    { href: "/dashboard/teacher/attendance", icon: CalendarCheck, key: "dashboard.attendance" },
    { href: "/dashboard/teacher/behavior", icon: Heart, key: "dashboard.behavior" },
    { href: "/dashboard/teacher/grades", icon: BookOpen, key: "dashboard.grades" },
    { href: "/dashboard/teacher/homework", icon: FileText, key: "dashboard.homework" },
    { href: "/dashboard/teacher/messages", icon: MessageSquare, key: "dashboard.messages" }
  ],
  STUDENT: [
    { href: "/dashboard/student", icon: LayoutDashboard, key: "dashboard.overview" },
    { href: "/dashboard/student/lessons", icon: BookOpen, key: "dashboard.lessons" },
    { href: "/dashboard/student/exams", icon: FileText, key: "dashboard.exams" },
    { href: "/dashboard/student/grades", icon: BookOpen, key: "dashboard.grades" },
    { href: "/dashboard/student/homework", icon: FileText, key: "dashboard.homework" },
    { href: "/dashboard/student/attendance", icon: CalendarCheck, key: "dashboard.attendance" },
    { href: "/dashboard/student/behavior", icon: Heart, key: "dashboard.behavior" },
    { href: "/dashboard/student/messages", icon: MessageSquare, key: "dashboard.messages" }
  ],
  ADMIN: [{ href: "/dashboard/admin", icon: ShieldCheck, key: "dashboard.admin" }]
};

export function Sidebar({ role }: { role: "DIRECTOR" | "TEACHER" | "STUDENT" | "ADMIN" }) {
  const { t, dir } = useLanguage();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();
  const items = navByRole[role];

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    router.push("/");
  };

  useEffect(() => {
    setSidebarOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-40 w-72 transform border-e border-gray-100 bg-white transition-transform duration-300 dark:border-white/5 dark:bg-brand-navy lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : dir === "rtl" ? "translate-x-full" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5 dark:border-white/5 lg:h-20">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9" />
            <div>
              <div className="font-display text-base font-extrabold text-brand-ink dark:text-brand-paper">
                Safha
              </div>
              <div className="text-[10px] uppercase tracking-wider text-brand-ink/50 dark:text-brand-paper/50">
                {user?.role}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-ink lg:hidden dark:hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {items.map((it) => {
            const active = pathname === it.href || (it.href !== "/dashboard/" + role.toLowerCase() && pathname?.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-brand-orange text-white shadow-md shadow-brand-orange/20"
                    : "text-brand-ink/80 hover:bg-brand-cream hover:text-brand-ink dark:text-brand-paper/70 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                <it.icon className="h-4 w-4 shrink-0" />
                <span>{t(it.key)}</span>
              </Link>
            );
          })}
        </nav>

        {user?.school && (
          <div className="mx-3 mt-4 rounded-2xl border border-gray-100 bg-brand-cream p-4 dark:border-white/5 dark:bg-white/5">
            <div className="flex items-center gap-3">
              {user.school.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.school.logoUrl} alt={user.school.name} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange/15 text-base font-bold text-brand-orange">
                  {user.school.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-brand-ink dark:text-brand-paper">
                  {user.school.name}
                </div>
                <div className="truncate text-[10px] text-brand-ink/50 dark:text-brand-paper/50">
                  {user.fullName}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 border-t border-gray-100 bg-white p-3 dark:border-white/5 dark:bg-brand-navy">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-ink/70 transition-all hover:bg-red-50 hover:text-red-600 dark:text-brand-paper/70 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            type="button"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-brand-ink/60 transition-all group-hover:bg-red-100 group-hover:text-red-600 dark:bg-white/5 dark:text-brand-paper/60 dark:group-hover:bg-red-500/20 dark:group-hover:text-red-400">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="flex-1 text-start">{t("common.signout")}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100">
              ⌘
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
