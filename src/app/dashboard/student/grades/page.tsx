"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { BookOpen } from "lucide-react";

type StudentData = {
  grades: { id: string; subject: string; score: number; maxScore: number; period: { name: string; coefficient: number; id: string } }[];
  periodAverages: { periodId: string; average: number; weightedAverage: number; examCount: number }[];
  periods: { id: string; name: string; startDate: string; endDate: string }[];
  overallAverage: number;
};

export default function StudentGradesPage() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<StudentData>("/api/dashboard/student")
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load grades"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <DashboardShell allowedRoles={["STUDENT"]}>
        <div className="flex h-64 items-center justify-center">
          {error ? (
            <div className="text-center">
              <p className="mb-3 text-sm text-red-500">{error}</p>
              <button onClick={() => window.location.reload()} className="btn-primary text-sm">Retry</button>
            </div>
          ) : (
            <Spinner className="h-8 w-8 text-brand-orange" />
          )}
        </div>
      </DashboardShell>
    );
  }

  const gradesByPeriod = data.periods.map((p) => ({
    period: p,
    grades: data.grades.filter((g) => g.period.id === p.id),
    average: data.periodAverages.find((pa) => pa.periodId === p.id)?.average ?? 0,
    weightedAverage: data.periodAverages.find((pa) => pa.periodId === p.id)?.weightedAverage ?? 0
  }));

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              My grades
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">All your grades and averages.</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-brand-orange to-blue-700 px-5 py-3 text-white shadow-lg shadow-brand-orange/30">
            <div className="text-xs font-bold uppercase tracking-wider opacity-90">Overall average</div>
            <div className="font-display text-3xl font-extrabold">{data.overallAverage.toFixed(2)}/20</div>
          </div>
        </div>

        {gradesByPeriod.length === 0 ? (
          <div className="card py-10 text-center text-sm text-gray-500">No grades yet.</div>
        ) : (
          gradesByPeriod.map(({ period, grades, average, weightedAverage }) => (
            <div key={period.id} className="card">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-brand-ink dark:text-brand-paper">{period.name}</h2>
                  <p className="text-xs text-gray-500">
                    {new Date(period.startDate).toLocaleDateString()} → {new Date(period.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-end">
                  <div className="text-xs text-gray-500">Average</div>
                  <div className="font-display text-2xl font-extrabold text-brand-orange">{average.toFixed(2)}</div>
                </div>
              </div>
              {grades.length === 0 ? (
                <p className="text-sm text-gray-500">No grades in this period.</p>
              ) : (
                <ul className="space-y-1.5">
                  {grades.map((g) => (
                    <li key={g.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm dark:bg-white/5">
                      <span className="font-semibold text-brand-ink dark:text-brand-paper">{g.subject}</span>
                      <span className="font-bold">
                        {g.score}/{g.maxScore}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
