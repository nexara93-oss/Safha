"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";

type ExamResult = {
  id: string;
  exam: {
    id: string;
    name: string;
    subject: string;
    date: string;
    coefficient: number;
    maxScore: number;
  };
  score: number | null;
};

export default function StudentExamsPage() {
  const { t } = useLanguage();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ results: ExamResult[] }>("/api/exam-results")
      .then((d) => setResults(d.results))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load exams"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell allowedRoles={["STUDENT"]}>
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand-orange" />
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell allowedRoles={["STUDENT"]}>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-sm text-red-500">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary text-sm">{t("student.exams.retry")}</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const pending = results.filter((r) => r.score === null);
  const graded = results.filter((r) => r.score !== null);

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("student.exams.title")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("student.exams.subtitle")}</p>
        </div>

        {results.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <BookOpen className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">{t("student.exams.noExams")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="card text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                  <Clock className="h-4 w-4" /> {t("student.exams.pending")}
                </div>
                <div className="mt-1 font-display text-3xl font-extrabold text-amber-600">{pending.length}</div>
              </div>
              <div className="card text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> {t("student.exams.graded")}
                </div>
                <div className="mt-1 font-display text-3xl font-extrabold text-emerald-600">{graded.length}</div>
              </div>
            </div>

            <div className="space-y-3">
              {results.map((r) => (
                <div key={r.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold text-brand-ink dark:text-brand-paper">{r.exam.name}</h3>
                        <span className="badge bg-brand-orange/10 text-brand-orange text-xs">{r.exam.subject}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(r.exam.date).toLocaleDateString()} · ×{r.exam.coefficient}
                      </p>
                    </div>
                    <div className="text-end">
                      {r.score !== null ? (
                        <div className="text-end">
                          <div className="font-display text-2xl font-extrabold text-brand-orange">{r.score}/{r.exam.maxScore}</div>
                          <span className="badge bg-emerald-100 text-emerald-700 text-[10px] dark:bg-emerald-500/15 dark:text-emerald-400">{t("student.exams.graded")}</span>
                        </div>
                      ) : (
                        <div className="text-end">
                          <div className="text-sm font-bold text-gray-400">—</div>
                          <span className="badge bg-amber-100 text-amber-700 text-[10px] dark:bg-amber-500/15 dark:text-amber-400">{t("student.exams.pending")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
