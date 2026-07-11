"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, TrendingUp, Users, Award } from "lucide-react";

type SectionStats = { sectionName: string; totalStudents: number };

type AvgGrade = { subject: string; average: number; count: number };

type TopStudent = { studentName: string; average: number };

type AnalyticsData = {
  studentsPerSection: SectionStats[];
  attendanceRate: number;
  averageGradesPerSubject: AvgGrade[];
  gradeDistribution: Record<string, number>;
  topPerformingStudents: TopStudent[];
};

export default function DirectorAnalyticsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AnalyticsData>("/api/analytics/director")
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell allowedRoles={["DIRECTOR"]}>
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand-orange" />
        </div>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell allowedRoles={["DIRECTOR"]}>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-sm text-red-500">{error ?? "No data available"}</p>
            <button onClick={() => window.location.reload()} className="btn-primary text-sm">Retry</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const maxStudents = data.studentsPerSection.length > 0 ? Math.max(...data.studentsPerSection.map((s) => s.totalStudents), 1) : 1;

  return (
    <DashboardShell allowedRoles={["DIRECTOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("dashboard.analytics")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("analytics.subtitle")}</p>
        </div>

        {/* Attendance rate card */}
        <div className="card bg-gradient-to-br from-brand-orange to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-90">{t("analytics.attendanceRate")}</div>
              <div className="font-display text-4xl font-extrabold">{data.attendanceRate}%</div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${data.attendanceRate}%` }}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Students per section */}
          <div className="card">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
              <Users className="h-4 w-4" />
              {t("analytics.studentsPerSection")}
            </div>
            {data.studentsPerSection.length === 0 ? (
              <p className="text-sm text-gray-500">{t("analytics.noSections")}</p>
            ) : (
              <div className="space-y-3">
                {data.studentsPerSection.map((s) => (
                  <div key={s.sectionName}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold text-brand-ink dark:text-brand-paper">{s.sectionName}</span>
                      <span className="text-gray-500">{s.totalStudents}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-orange to-orange-400 transition-all"
                        style={{ width: `${(s.totalStudents / maxStudents) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grade distribution */}
          <div className="card">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
              <BarChart3 className="h-4 w-4" />
              {t("analytics.gradeDistribution")}
            </div>
            {(() => {
              const distArray = Object.entries(data.gradeDistribution).map(([range, count]) => ({ range, count }));
              if (distArray.length === 0) return <p className="text-sm text-gray-500">{t("analytics.noGrades")}</p>;
              const maxCount = Math.max(...distArray.map((d) => d.count), 1);
              return (
                <div className="space-y-3">
                  {distArray.map((g) => (
                    <div key={g.range}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-semibold text-brand-ink dark:text-brand-paper">{g.range}</span>
                        <span className="text-gray-500">{g.count}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                          style={{ width: `${(g.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Average grades per subject */}
          <div className="card">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
              <BarChart3 className="h-4 w-4" />
              {t("analytics.avgGrades")}
            </div>
            {data.averageGradesPerSubject.length === 0 ? (
              <p className="text-sm text-gray-500">{t("analytics.noGrades")}</p>
            ) : (
              <div className="space-y-3">
                {data.averageGradesPerSubject.map((s) => (
                  <div key={s.subject}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold text-brand-ink dark:text-brand-paper">{s.subject}</span>
                      <span className="text-gray-500">{s.average.toFixed(2)}/20</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                        style={{ width: `${(s.average / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top 5 performing students */}
          <div className="card">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
              <Award className="h-4 w-4" />
              {t("analytics.topStudents")}
            </div>
            {data.topPerformingStudents.length === 0 ? (
              <p className="text-sm text-gray-500">{t("analytics.noData")}</p>
            ) : (
              <div className="space-y-2">
                {data.topPerformingStudents.map((s, i) => (
                  <div
                    key={s.studentName}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white ${
                        i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-600" : "bg-brand-orange/60"
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-brand-ink dark:text-brand-paper">{s.studentName}</div>
                      </div>
                    </div>
                    <span className="font-display text-xl font-extrabold text-brand-orange">{s.average.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
