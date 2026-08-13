"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "@/components/ui/Modal";
import { Plus, Settings, Save, X } from "lucide-react";

function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Student = { id: string; user: { fullName: string }; sectionId: string | null };
type Section = { id: string; name: string };
type Period = { id: string; name: string; startDate: string; endDate: string; coefficient: number; examCount: number };
type Grade = {
  id: string;
  studentId: string;
  periodId: string;
  subject: string;
  score: number;
  maxScore: number;
  student: { user: { fullName: string } };
  period: { name: string; coefficient: number };
};

export default function TeacherGradesPage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [defaultSubject, setDefaultSubject] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("20");
  const [submitting, setSubmitting] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodName, setPeriodName] = useState("");
  const [periodStart, setPeriodStart] = useState(() => (typeof window !== "undefined" ? localDateStr() : ""));
  const [periodEnd, setPeriodEnd] = useState(() =>
    typeof window !== "undefined" ? localDateStr(new Date(Date.now() + 30 * 86400000)) : ""
  );
  const [periodCoef, setPeriodCoef] = useState("1");
  const [periodCount, setPeriodCount] = useState("1");
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionFilter, setSectionFilter] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      api<{ teacher?: { subject: string } }>("/api/dashboard/teacher").catch(() => ({ teacher: undefined })),
      api<{ students: Student[] }>("/api/students"),
      api<{ periods: Period[] }>("/api/exam-periods"),
      api<{ grades: Grade[] }>("/api/grades"),
      api<{ sections: Section[] }>("/api/sections")
    ])
      .then(([profile, s, p, g, sec]) => {
        if (profile?.teacher?.subject) setDefaultSubject(profile.teacher.subject);
        setStudents(s.students);
        setPeriods(p.periods);
        setGrades(g.grades);
        setSections(sec.sections);
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : t("common.failed")))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api("/api/grades", {
        method: "POST",
        json: {
          studentId,
          periodId,
          subject: defaultSubject.trim(),
          score: Number(score),
          maxScore: Number(maxScore)
        }
      });
      setStudentId("");
      setScore("");
      setMaxScore("20");
      setSectionFilter("");
      setOpen(false);
      success(t("teacher.grades.gradeAdded"));
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("common.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const savePeriod = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingPeriod) {
        await api("/api/exam-periods", {
          method: "PATCH",
          json: {
            id: editingPeriod.id,
            name: periodName,
            startDate: periodStart,
            endDate: periodEnd,
            coefficient: Number(periodCoef),
            examCount: Number(periodCount)
          }
        });
        success(t("teacher.grades.periodUpdated"));
      } else {
        await api("/api/exam-periods", {
          method: "POST",
          json: {
            name: periodName,
            startDate: periodStart,
            endDate: periodEnd,
            coefficient: Number(periodCoef),
            examCount: Number(periodCount)
          }
        });
        success(t("teacher.grades.periodCreated"));
      }
      setPeriodOpen(false);
      setEditingPeriod(null);
      setPeriodName("");
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("common.failed"));
    }
  };

  const onDeletePeriod = async (p: Period) => {
    if (!confirm(t("teacher.grades.deletePeriodConfirm", { name: p.name }))) return;
    try {
      await api(`/api/exam-periods/${p.id}`, { method: "DELETE" });
      success(t("teacher.grades.periodDeleted"));
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("common.failed"));
    }
  };

  const openEditPeriod = (p: Period) => {
    setEditingPeriod(p);
    setPeriodName(p.name);
    setPeriodStart(localDateStr(new Date(p.startDate)));
    setPeriodEnd(localDateStr(new Date(p.endDate)));
    setPeriodCoef(String(p.coefficient));
    setPeriodCount(String(p.examCount));
    setPeriodOpen(true);
  };

  const filteredGrades = sectionFilter
    ? grades.filter((g) => {
        const student = students.find((s) => s.id === g.studentId);
        return student?.sectionId === sectionFilter;
      })
    : grades;

  return (
    <DashboardShell allowedRoles={["TEACHER"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.grades")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("teacher.grades.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEditingPeriod(null); setPeriodName(""); setPeriodOpen(true); }} className="btn-ghost">
              <Settings className="h-4 w-4" /> {t("teacher.grades.periods")}
            </button>
            <button onClick={() => setOpen(true)} className="btn-primary" disabled={periods.length === 0}>
              <Plus className="h-4 w-4" /> {t("teacher.grades.addGrade")}
            </button>
          </div>
        </div>

        {loading || loadError ? (
          <div className="flex h-48 items-center justify-center">
            {loadError ? (
              <div className="text-center">
                <p className="mb-3 text-sm text-red-500">{loadError}</p>
                <button onClick={load} className="btn-primary text-sm">{t("common.retry")}</button>
              </div>
            ) : (
              <Spinner className="h-8 w-8 text-brand-orange" />
            )}
          </div>
        ) : (
          <>
            <div className="card">
              <h2 className="mb-3 text-sm font-bold text-brand-ink dark:text-brand-paper">{t("teacher.grades.examPeriods")}</h2>
              {periods.length === 0 ? (
                <p className="text-sm text-gray-500">{t("teacher.grades.noPeriods")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {periods.map((p) => (
                    <div key={p.id} className="flex items-center gap-1 rounded-full border border-gray-200 bg-white py-1.5 pe-1 ps-3 text-xs font-semibold dark:border-white/10 dark:bg-white/5">
                      <span>{p.name}</span>
                      <span className="text-gray-400">{t("teacher.grades.periodInfo", { coefficient: p.coefficient, examCount: p.examCount })}</span>
                      <button onClick={() => openEditPeriod(p)} className="ms-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-orange dark:hover:bg-white/10">
                        <Settings className="h-3 w-3" />
                      </button>
                      <button onClick={() => onDeletePeriod(p)} className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-brand-ink dark:text-brand-paper">{t("teacher.grades.allGrades")}</h2>
                {sections.length > 0 && (
                  <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="input-field !py-1.5 !text-xs"
                  >
                    <option value="">{t("common.allSections")}</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>
              {grades.length === 0 ? (
                <p className="text-sm text-gray-500">{t("teacher.grades.noGrades")}</p>
              ) : filteredGrades.length === 0 ? (
                <p className="text-sm text-gray-500">{t("teacher.grades.noGradesSection")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="py-2 text-start">{t("common.student")}</th>
                        <th className="py-2 text-start">{t("common.subject")}</th>
                        <th className="py-2 text-start">{t("teacher.grades.period")}</th>
                        <th className="py-2 text-end">{t("common.score")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrades.map((g) => (
                        <tr key={g.id} className="border-t border-gray-100 dark:border-white/5">
                          <td className="py-2 font-semibold text-brand-ink dark:text-brand-paper">{g.student.user.fullName}</td>
                          <td className="py-2 text-gray-600 dark:text-white/70">{g.subject}</td>
                          <td className="py-2 text-gray-600 dark:text-white/70">{g.period.name}</td>
                          <td className="py-2 text-end font-bold">
                            {g.score}/{g.maxScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setSectionFilter(""); }} title={t("teacher.grades.addGradeTitle")} size="md">
        <form onSubmit={onAdd} className="space-y-3">
          {sections.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.section")}</label>
              <select value={sectionFilter} onChange={(e) => { setSectionFilter(e.target.value); setStudentId(""); }} className="input-field">
                <option value="">{t("common.allSections")}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.student")}</label>
            <select required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input-field">
              <option value="">{t("common.choose")}</option>
              {(sectionFilter ? students.filter((s) => s.sectionId === sectionFilter) : students).map((s) => (
                <option key={s.id} value={s.id}>{s.user.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.grades.period")}</label>
            <select required value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="input-field">
              <option value="">{t("common.choose")}</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (×{p.coefficient})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.subject")}</label>
            <input
              required
              value={defaultSubject}
              readOnly
              className="input-field cursor-not-allowed bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50"
              placeholder={t("teacher.grades.subjectPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.score")}</label>
              <input required type="number" min="0" step="0.25" value={score} onChange={(e) => setScore(e.target.value)} className="input-field" placeholder="15" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.grades.max")}</label>
              <input required type="number" min="1" step="0.5" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">{t("common.cancel")}</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Spinner /> : t("common.add")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={periodOpen} onClose={() => { setPeriodOpen(false); setEditingPeriod(null); }} title={editingPeriod ? t("teacher.grades.editPeriod") : t("teacher.grades.newExamPeriod")} size="md">
        <form onSubmit={savePeriod} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.name")}</label>
            <input required value={periodName} onChange={(e) => setPeriodName(e.target.value)} className="input-field" placeholder={t("teacher.grades.namePlaceholder")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.grades.start")}</label>
              <input required type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.grades.end")}</label>
              <input required type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.grades.coefficient")}</label>
              <input required type="number" min="0.1" step="0.1" value={periodCoef} onChange={(e) => setPeriodCoef(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.grades.examCount")}</label>
              <input required type="number" min="1" step="1" value={periodCount} onChange={(e) => setPeriodCount(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => { setPeriodOpen(false); setEditingPeriod(null); }} className="btn-ghost">{t("common.cancel")}</button>
            <button type="submit" className="btn-primary">
              <Save className="h-4 w-4" />
              {editingPeriod ? t("common.save") : t("teacher.grades.create")}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
