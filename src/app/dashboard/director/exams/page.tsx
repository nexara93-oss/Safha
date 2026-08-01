"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, CheckCircle2, Clock, Filter, Pencil, Trash2 } from "lucide-react";

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
  const { success, error } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState("");
  const [editing, setEditing] = useState<Exam | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editCoefficient, setEditCoefficient] = useState("1");
  const [editMaxScore, setEditMaxScore] = useState("20");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api<{ exams: Exam[] }>("/api/exams"),
      api<{ sections: Section[] }>("/api/sections")
    ])
      .then(([e, s]) => {
        setExams(e.exams);
        setSections(s.sections);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onDelete = async (exam: Exam) => {
    if (!confirm(t("director.exams.deleteConfirm", { name: exam.name }))) return;
    try {
      await api(`/api/exams/${exam.id}`, { method: "DELETE" });
      success(t("director.exams.deleteSuccess"));
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("director.exams.deleteFailed"));
    }
  };

  const openEdit = (exam: Exam) => {
    setEditing(exam);
    setEditName(exam.name);
    setEditSubject(exam.subject);
    setEditDate(exam.date.slice(0, 10));
    setEditStartTime(exam.startTime ?? "");
    setEditEndTime(exam.endTime ?? "");
    setEditCoefficient(String(exam.coefficient));
    setEditMaxScore(String(exam.maxScore));
  };

  const onSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await api(`/api/exams/${editing.id}`, {
        method: "PATCH",
        json: {
          name: editName.trim(),
          subject: editSubject.trim(),
          date: new Date(editDate).toISOString(),
          startTime: editStartTime || null,
          endTime: editEndTime || null,
          coefficient: Number(editCoefficient),
          maxScore: Number(editMaxScore)
        }
      });
      success(t("director.exams.updateSuccess"));
      setEditing(null);
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("director.exams.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

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
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
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
                        <div className="flex shrink-0 items-center gap-1">
                          {total > 0 && (
                            <div className="text-xs font-semibold">
                              <span className={graded === total ? "text-emerald-600" : "text-amber-600"}>
                                {Math.round((graded / total) * 100)}%
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => openEdit(exam)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-white"
                            aria-label={t("common.edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDelete(exam)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                            aria-label={t("common.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title={t("director.exams.editTitle")} size="lg">
        {editing && (
          <form onSubmit={onSaveEdit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.name")}</label>
                <input required value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.subject")}</label>
                <input required value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.date")}</label>
              <input required type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.startTime")}</label>
                <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.endTime")}</label>
                <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.exams.coefficient")}</label>
                <input required type="number" min="0" step="0.1" value={editCoefficient} onChange={(e) => setEditCoefficient(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.exams.maxScore")}</label>
                <input required type="number" min="0.1" step="0.5" value={editMaxScore} onChange={(e) => setEditMaxScore(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">{t("common.cancel")}</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Spinner /> : t("common.save")}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardShell>
  );
}
