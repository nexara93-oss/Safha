"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { CalendarCheck, CalendarX } from "lucide-react";

type Rec = { status: string; date: string };

export default function StudentAttendancePage() {
  const { t } = useLanguage();
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ attendance: Rec[] }>("/api/attendance")
      .then((d) => setRecs(d.attendance))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load attendance"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell allowedRoles={["STUDENT"]}>
        <div className="flex h-64 items-center justify-center">
          {error ? (
            <div className="text-center">
              <p className="mb-3 text-sm text-red-500">{error}</p>
              <button onClick={() => window.location.reload()} className="btn-primary text-sm">{t("student.attendance.retry")}</button>
            </div>
          ) : (
            <Spinner className="h-8 w-8 text-brand-orange" />
          )}
        </div>
      </DashboardShell>
    );
  }

  const present = recs.filter((r) => r.status === "PRESENT").length;
  const absent = recs.filter((r) => r.status === "ABSENT").length;

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("student.attendance.title")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("student.attendance.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="card flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">{t("student.attendance.present")}</div>
              <div className="font-display text-2xl font-extrabold text-brand-ink dark:text-brand-paper">{present}</div>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
              <CalendarX className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">{t("student.attendance.absent")}</div>
              <div className="font-display text-2xl font-extrabold text-brand-ink dark:text-brand-paper">{absent}</div>
            </div>
          </div>
        </div>

        {recs.length === 0 ? (
          <div className="card py-10 text-center text-sm text-gray-500">{t("student.attendance.noRecords")}</div>
        ) : (
          <div className="card p-3 sm:p-4">
            <ul className="space-y-1.5">
              {recs.map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm dark:bg-white/5">
                  <span className="font-semibold text-brand-ink dark:text-brand-paper">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                  <span
                    className={`badge ${
                      r.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                    }`}
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
