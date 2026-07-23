"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, CheckCircle2, Clock, Filter } from "lucide-react";

type Section = { id: string; name: string };
type Exam = {
  id: string;
  name: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  coefficient: number;
  maxScore: number;
  section: { id: string; name: string } | null;
  _count?: { results: number; gradedResults: number };
};

export default function DirectorExamsPage() {
  const { t } = useLanguage();
  const [exams, setExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ exams: Exam[] }>("/api/exams"),
      api<{ sections: Section[] }>("/api/sections")
    ])
      .then(([e, s]) => {
        setExams(e.exams);
        setSections(s.sections);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = sectionFilter ? exams.filter((ex) => ex.section?.id === sectionFilter) : exams;

  const totalExams = filtered.length;
  const gradedCount = filtered.filter((ex) => (ex._count?.gradedResults ?? 0) > 0).length;
  const pendingCount = totalExams - gradedCount;

  return (
    <DashboardShell allowedRoles={["DIRECTOR"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.exams")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("director.exams.overview")}</p>
          </div>
          {sections.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="input-field !py-1.5 !text-xs"
              >
                <option value="">{t("director.exams.allSections")}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{t("director.exams.total")}</div>
                <div className="mt-1 font-display text-3xl font-extrabold text-brand-ink dark:text-brand-paper">{totalExams}</div>
              </div>
              <div className="card text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> {t("director.exams.graded")}
                </div>
                <div className="mt-1 font-display text-3xl font-extrabold text-emerald-600">{gradedCount}</div>
              </div>
              <div className="card text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600">
                  <Clock className="h-3 w-3" /> {t("director.exams.pending")}
                </div>
                <div className="mt-1 font-display text-3xl font-extrabold text-amber-600">{pendingCount}</div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="card flex flex-col items-center gap-2 py-12 text-center">
                <BookOpen className="h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">{sectionFilter ? t("director.exams.noExamsInSection") : t("director.exams.noExams")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((exam) => {
                  const graded = exam._count?.gradedResults ?? 0;
                  const total = exam._count?.results ?? 0;
                  return (
                    <div key={exam.id} className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-lg font-bold text-brand-ink dark:text-brand-paper">{exam.name}</h3>
                            <span className="badge bg-brand-orange/10 text-brand-orange text-xs">{exam.subject}</span>
                            <span className="badge bg-gray-100 text-gray-600 text-xs dark:bg-white/10 dark:text-white/70">{exam.section?.name ?? "—"}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {new Date(exam.date).toLocaleDateString()} · ×{exam.coefficient} · /{exam.maxScore}
                            {total > 0 && ` · ${graded}/${total} graded`}
                          </p>
                        </div>
                        <div className="text-end">
                          {total > 0 && (
                            <div className="text-xs font-semibold">
                              <span className={graded === total ? "text-emerald-600" : "text-amber-600"}>
                                {Math.round((graded / total) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
