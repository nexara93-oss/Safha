"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";

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
};

type Student = { id: string; user: { fullName: string } };
type ExamResult = { id: string; studentId: string; score: number | null; student: { user: { fullName: string } } };

export default function TeacherExamsPage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [coefficient, setCoefficient] = useState("1");
  const [maxScore, setMaxScore] = useState("20");
  const [submitting, setSubmitting] = useState(false);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { id: string; score: string }>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

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

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api("/api/exams", {
        method: "POST",
        json: {
          name: name.trim(),
          subject: subject.trim(),
          sectionId,
          date,
          startTime,
          endTime,
          coefficient: Number(coefficient),
          maxScore: Number(maxScore)
        }
      });
      setName("");
      setSubject("");
      setSectionId("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setCoefficient("1");
      setMaxScore("20");
      setOpen(false);
      success("Exam created");
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this exam?")) return;
    try {
      await api(`/api/exams/${id}`, { method: "DELETE" });
      success("Exam deleted");
      if (expandedExam === id) setExpandedExam(null);
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    }
  };

  const loadResults = async (examId: string) => {
    setExpandedExam(examId);
    setLoadingResults(true);
    setResults({});
    try {
      const [resData, stuData] = await Promise.all([
        api<{ results: ExamResult[] }>(`/api/exam-results?examId=${examId}`),
        api<{ students: Student[] }>("/api/students")
      ]);
      setStudents(stuData.students);
      const resultMap: Record<string, { id: string; score: string }> = {};
      resData.results.forEach((r) => {
        resultMap[r.studentId] = { id: r.id, score: r.score !== null ? String(r.score) : "" };
      });
      setResults(resultMap);
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed to load results");
    } finally {
      setLoadingResults(false);
    }
  };

  const saveScore = async (studentId: string) => {
    const entry = results[studentId];
    if (!entry) return;
    try {
      if (entry.id) {
        await api(`/api/exam-results/${entry.id}`, {
          method: "PATCH",
          json: { score: entry.score ? Number(entry.score) : null }
        });
      } else {
        const res = await api<{ result: { id: string } }>("/api/exam-results", {
          method: "POST",
          json: { examId: expandedExam, studentId, score: entry.score ? Number(entry.score) : null }
        });
        setResults((prev) => ({
          ...prev,
          [studentId]: { ...prev[studentId], id: res.result.id }
        }));
      }
      success("Score saved");
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed to save score");
    }
  };

  const examStudents = expandedExam
    ? students
    : [];

  return (
    <DashboardShell allowedRoles={["TEACHER"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.exams")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">Create and manage exams.</p>
          </div>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> {t("common.add")} exam
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : exams.length === 0 ? (
          <div className="card py-12 text-center text-sm text-gray-500">No exams yet. Click "Add exam" to create one.</div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <div key={exam.id} className="card">
                <button
                  onClick={() => loadResults(exam.id)}
                  className="flex w-full items-center justify-between text-start"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-brand-ink dark:text-brand-paper">{exam.name}</h3>
                      <span className="badge bg-brand-orange/10 text-brand-orange text-xs">{exam.subject}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {exam.section?.name ?? "—"} · {new Date(exam.date).toLocaleDateString()} · ×{exam.coefficient} · /{exam.maxScore}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(exam.id); }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {expandedExam === exam.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>
                {expandedExam === exam.id && (
                  <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/5">
                    {loadingResults ? (
                      <div className="flex justify-center py-4">
                        <Spinner className="h-6 w-6 text-brand-orange" />
                      </div>
                    ) : examStudents.length === 0 ? (
                      <p className="py-4 text-center text-sm text-gray-500">No students found.</p>
                    ) : (
                      <div className="space-y-2">
                        {examStudents.map((st) => (
                          <div key={st.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                            <span className="text-sm font-semibold text-brand-ink dark:text-brand-paper">{st.user.fullName}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={exam.maxScore}
                                step="0.5"
                                value={results[st.id]?.score ?? ""}
                                onChange={(e) =>
                                  setResults((prev) => ({
                                    ...prev,
                                    [st.id]: { id: prev[st.id]?.id ?? "", score: e.target.value }
                                  }))
                                }
                                className="input-field !w-20 !py-1 !text-xs !text-center"
                                placeholder="Score"
                              />
                              <span className="text-xs text-gray-400">/{exam.maxScore}</span>
                              <button
                                onClick={() => saveScore(st.id)}
                                className="rounded-lg p-1.5 text-gray-400 hover:text-brand-orange"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add exam" size="lg">
        <form onSubmit={onAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Midterm exam" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Subject</label>
              <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" placeholder="Mathematics" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Section</label>
            <select required value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="input-field">
              <option value="">Choose…</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Date</label>
            <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Start time</label>
              <input required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">End time</label>
              <input required type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Coefficient</label>
              <input required type="number" min="0.1" step="0.1" value={coefficient} onChange={(e) => setCoefficient(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Max score</label>
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
    </DashboardShell>
  );
}
