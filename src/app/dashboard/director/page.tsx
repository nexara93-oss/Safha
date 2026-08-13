"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CalendarX,
  HelpCircle,
  TrendingUp,
  CreditCard,
  X
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

type DirectorStats = {
  teacherCount: number;
  studentCount: number;
  sectionCount: number;
  todayPresent: number;
  todayAbsent: number;
  todayUnknown: number;
};

type Teacher = {
  id: string;
  subject: string;
  user: { fullName: string; status: string };
  attendance: { status: string }[];
};

type Sub = { plan: string; endDate: string } | null;

export default function DirectorOverviewPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<DirectorStats | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sub, setSub] = useState<Sub>(null);
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "UNKNOWN">("ALL");
  const listRef = useRef<HTMLDivElement>(null);

  const applyFilter = (f: "ALL" | "PRESENT" | "ABSENT" | "UNKNOWN") => {
    setFilter(f);
    setTimeout(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const filteredTeachers =
    filter === "ALL"
      ? teachers.slice(0, 6)
      : teachers
          .filter((tch) => (tch.attendance[0]?.status || "UNKNOWN") === filter)
          .slice(0, 6);

  useEffect(() => {
    Promise.all([api<{ stats: DirectorStats; teachers: Teacher[]; subscription: Sub; trialDaysLeft: number | null }>("/api/dashboard/director"), api<{ subscription: Sub }>("/api/subscription")])
      .then(([d, s]) => {
        setStats(d.stats);
        setTeachers(d.teachers);
        setSub(d.subscription);
        setTrialDays(d.trialDaysLeft);
        if (s.subscription) setSub(s.subscription);
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : t("common.failed")))
      .finally(() => setLoading(false));
  }, []);

  if (loading || loadError) {
    return (
      <DashboardShell allowedRoles={["DIRECTOR"]}>
        <div className="flex h-64 items-center justify-center">
          {loadError ? (
            <div className="text-center">
              <p className="mb-3 text-sm text-red-500">{loadError}</p>
              <button onClick={() => window.location.reload()} className="btn-primary text-sm">{t("common.retry")}</button>
            </div>
          ) : (
            <Spinner className="h-8 w-8 text-brand-orange" />
          )}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell allowedRoles={["DIRECTOR"]}>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.overview")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">
              {t("director.welcomeBack", { name: user?.fullName.split(" ")[0] ?? "" })}
            </p>
          </div>
          {sub?.plan === "FREE_TRIAL" && trialDays !== null && (
            <div className="rounded-2xl border border-brand-orange/20 bg-brand-orange/5 px-4 py-3 text-sm dark:bg-brand-orange/10">
              <div className="flex items-center gap-2 font-semibold text-brand-orange">
                <CreditCard className="h-4 w-4" />
                {t("trial.daysLeft", { count: trialDays })}
              </div>
              <Link href="/dashboard/director/payment" className="mt-1 inline-block text-xs font-semibold text-brand-orange hover:underline">
                {t("trial.upgradeCta")}
              </Link>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label={t("stat.teachers")} value={stats?.teacherCount ?? 0} icon={Users} color="from-blue-500 to-blue-700" />
          <StatCard label={t("stat.students")} value={stats?.studentCount ?? 0} icon={GraduationCap} color="from-indigo-500 to-indigo-600" />
          <StatCard label={t("stat.sections")} value={stats?.sectionCount ?? 0} icon={BookOpen} color="from-emerald-500 to-emerald-600" />
          <StatCard label={t("stat.todayPresent")} value={stats?.todayPresent ?? 0} icon={CalendarCheck} color="from-blue-500 to-blue-600" />
        </div>

        {/* Today attendance */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-ink dark:text-brand-paper">{t("attendance.title")}</h2>
            <Link href="/dashboard/director/teachers" className="text-xs font-semibold text-brand-orange hover:underline">
              {t("attendance.manageTeachers")}
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => applyFilter("PRESENT")}
              className="group cursor-pointer rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-start transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:border-emerald-400/50"
            >
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CalendarCheck className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{t("attendance.present")}</span>
              </div>
              <div className="mt-2 font-display text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {stats?.todayPresent ?? 0}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600/70 opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-300/70">
                {t("common.search")} →
              </div>
            </button>
            <button
              type="button"
              onClick={() => applyFilter("ABSENT")}
              className="group cursor-pointer rounded-2xl border border-red-100 bg-red-50 p-4 text-start transition-all hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md dark:border-red-500/20 dark:bg-red-500/10 dark:hover:border-red-400/50"
            >
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <CalendarX className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{t("attendance.absent")}</span>
              </div>
              <div className="mt-2 font-display text-3xl font-extrabold text-red-700 dark:text-red-400">
                {stats?.todayAbsent ?? 0}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-red-600/70 opacity-0 transition-opacity group-hover:opacity-100 dark:text-red-300/70">
                {t("common.search")} →
              </div>
            </button>
            <button
              type="button"
              onClick={() => applyFilter("UNKNOWN")}
              className="group cursor-pointer rounded-2xl border border-gray-100 bg-gray-50 p-4 text-start transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-white/30"
            >
              <div className="flex items-center gap-2 text-gray-600 dark:text-white/60">
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{t("attendance.notMarked")}</span>
              </div>
              <div className="mt-2 font-display text-3xl font-extrabold text-gray-600 dark:text-white/60">
                {stats?.todayUnknown ?? 0}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500/70 opacity-0 transition-opacity group-hover:opacity-100 dark:text-white/40">
                {t("common.search")} →
              </div>
            </button>
          </div>

          <div ref={listRef} className="mt-4">
            {filter !== "ALL" && (
              <div className="mb-3 flex items-center justify-between rounded-xl bg-brand-orange/5 px-3 py-2 text-xs dark:bg-brand-orange/10">
                <span className="font-semibold text-brand-orange">
                  {t(`status.${filter}`)} • {t("director.teacherCount", { count: filteredTeachers.length })}
                </span>
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-brand-orange hover:bg-brand-orange/10"
                >
                  <X className="h-3 w-3" />
                  {t("director.clearFilter")}
                </button>
              </div>
            )}
            <div className="space-y-2">
              {filteredTeachers.map((tch) => {
                const status = tch.attendance[0]?.status || "UNKNOWN";
                return (
                  <div
                    key={tch.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm dark:border-white/5 dark:bg-white/5"
                  >
                    <div>
                      <div className="font-semibold text-brand-ink dark:text-brand-paper">{tch.user.fullName}</div>
                      <div className="text-xs text-gray-500">{tch.subject}</div>
                    </div>
                    <span
                      className={`badge ${
                        status === "PRESENT"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : status === "ABSENT"
                          ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                          : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70"
                      }`}
                    >
                      {t(`status.${status}`)}
                    </span>
                  </div>
                );
              })}
              {filteredTeachers.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-500">
                  {filter === "ALL"
                    ? t("director.noTeachers")
                    : t("director.noTeachersWithStatus", { status: t(`status.${filter}`) })}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Link href="/dashboard/director/teachers" className="card group flex items-center justify-between transition-all hover:border-brand-orange hover:shadow-lg">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-orange">
                <TrendingUp className="h-3.5 w-3.5" />
                {t("director.quickAction")}
              </div>
              <div className="mt-2 font-display text-lg font-bold text-brand-ink dark:text-brand-paper">{t("director.addTeacher")}</div>
              <div className="text-sm text-gray-500">{t("director.addTeacherDesc")}</div>
            </div>
            <Users className="h-8 w-8 text-brand-orange transition-transform group-hover:scale-110" />
          </Link>
          <Link href="/dashboard/director/students" className="card group flex items-center justify-between transition-all hover:border-brand-orange hover:shadow-lg">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-orange">
                <TrendingUp className="h-3.5 w-3.5" />
                {t("director.quickAction")}
              </div>
              <div className="mt-2 font-display text-lg font-bold text-brand-ink dark:text-brand-paper">{t("director.browseStudents")}</div>
              <div className="text-sm text-gray-500">{t("director.browseStudentsDesc")}</div>
            </div>
            <GraduationCap className="h-8 w-8 text-brand-orange transition-transform group-hover:scale-110" />
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="card group hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-brand-ink dark:text-brand-paper">{value}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
