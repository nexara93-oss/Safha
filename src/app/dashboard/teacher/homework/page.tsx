"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Save, FileText, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

type Section = { id: string; name: string };
type Student = { id: string; user: { fullName: string } };
type Submission = {
  id: string;
  homeworkId: string;
  studentId: string;
  student: { user: { fullName: string } };
  content: string | null;
  fileUrl: string | null;
  score: number | null;
  maxScore: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
};
type Homework = {
  id: string;
  sectionId: string;
  section: { name: string };
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  fileUrl: string | null;
  createdAt: string;
  submissions?: Submission[];
};

export default function TeacherHomeworkPage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [loadingSubs, setLoadingSubs] = useState<Record<string, boolean>>({});
  const [gradeValues, setGradeValues] = useState<Record<string, { score: string; feedback: string }>>({});
  const [gradingSub, setGradingSub] = useState<Record<string, boolean>>({});

  const [formSection, setFormSection] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formFileUrl, setFormFileUrl] = useState("");

  const loadHomeworks = () => {
    setLoading(true);
    const url = sectionFilter ? `/api/homework?sectionId=${sectionFilter}` : "/api/homework";
    api<{ homeworks: Homework[] }>(url)
      .then((d) => setHomeworks(d.homeworks))
      .catch((e: unknown) => error(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api<{ sections: Section[] }>("/api/sections")
      .then((d) => setSections(d.sections))
      .catch(() => {});
  }, []);

  useEffect(() => { loadHomeworks(); }, [sectionFilter]);

  const loadSubmissions = async (hwId: string) => {
    setLoadingSubs((p) => ({ ...p, [hwId]: true }));
    try {
      const d = await api<{ submissions: Submission[] }>(`/api/homework-submissions?homeworkId=${hwId}`);
      setSubmissions((p) => ({ ...p, [hwId]: d.submissions }));
      const vals: Record<string, { score: string; feedback: string }> = {};
      d.submissions.forEach((s) => {
        vals[s.id] = { score: s.score !== null ? String(s.score) : "", feedback: s.feedback || "" };
      });
      setGradeValues((p) => ({ ...p, ...vals }));
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingSubs((p) => ({ ...p, [hwId]: false }));
    }
  };

  const toggleExpand = (hwId: string) => {
    if (expandedId === hwId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(hwId);
    if (!submissions[hwId]) loadSubmissions(hwId);
  };

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api("/api/homework", {
        method: "POST",
        json: {
          sectionId: formSection,
          subject: formSubject.trim(),
          title: formTitle.trim(),
          description: formDesc.trim(),
          dueDate: formDueDate,
          fileUrl: formFileUrl.trim() || undefined
        }
      });
      setAddOpen(false);
      setFormSection("");
      setFormSubject("");
      setFormTitle("");
      setFormDesc("");
      setFormDueDate("");
      setFormFileUrl("");
      success("Homework created");
      loadHomeworks();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (hw: Homework) => {
    if (!confirm(`Delete "${hw.title}"?`)) return;
    try {
      await api(`/api/homework/${hw.id}`, { method: "DELETE" });
      success("Deleted");
      loadHomeworks();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    }
  };

  const onGrade = async (submissionId: string) => {
    const vals = gradeValues[submissionId];
    if (!vals || vals.score === "") return;
    setGradingSub((p) => ({ ...p, [submissionId]: true }));
    try {
      await api(`/api/homework-submissions/${submissionId}`, {
        method: "PATCH",
        json: {
          score: Number(vals.score),
          feedback: vals.feedback.trim()
        }
      });
      success("Graded");
      if (expandedId) loadSubmissions(expandedId);
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    } finally {
      setGradingSub((p) => ({ ...p, [submissionId]: false }));
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date(new Date().toDateString());

  const filtered = sectionFilter ? homeworks.filter((h) => h.sectionId === sectionFilter) : homeworks;

  return (
    <DashboardShell allowedRoles={["TEACHER"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.homework")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">Create and manage homework assignments.</p>
          </div>
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Homework
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : (
          <>
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-brand-ink dark:text-brand-paper">Assignments</h2>
                {sections.length > 0 && (
                  <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="input-field !py-1.5 !text-xs"
                  >
                    <option value="">All sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {homeworks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <FileText className="h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">No homework yet. Click "Add Homework" to create one.</p>
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-gray-500">No homework in this section.</p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((hw) => (
                    <div key={hw.id} className="rounded-xl border border-gray-100 bg-white dark:border-white/5 dark:bg-white/5">
                      <button
                        onClick={() => toggleExpand(hw.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-start"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-brand-ink dark:text-brand-paper">{hw.title}</span>
                            <span className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-[10px] font-bold text-brand-orange">{hw.subject}</span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                            <span>{hw.section.name}</span>
                            <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                            {isOverdue(hw.dueDate) && <span className="text-red-500 font-semibold">Overdue</span>}
                            {submissions[hw.id] && <span>{submissions[hw.id].length} submission(s)</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(hw); }}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {expandedId === hw.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </button>

                      {expandedId === hw.id && (
                        <div className="border-t border-gray-100 px-4 py-3 dark:border-white/5">
                          {hw.description && (
                            <p className="mb-3 text-sm text-gray-600 dark:text-white/70">{hw.description}</p>
                          )}
                          {hw.fileUrl && (
                            <a href={hw.fileUrl} target="_blank" rel="noopener noreferrer" className="mb-3 inline-flex items-center gap-1 text-sm text-brand-orange hover:underline">
                              <FileText className="h-3 w-3" /> Attached file
                            </a>
                          )}
                          {loadingSubs[hw.id] ? (
                            <div className="flex justify-center py-4">
                              <Spinner className="h-5 w-5 text-brand-orange" />
                            </div>
                          ) : submissions[hw.id]?.length === 0 ? (
                            <p className="py-3 text-center text-sm text-gray-500">No submissions yet.</p>
                          ) : submissions[hw.id] ? (
                            <div className="space-y-2">
                              {submissions[hw.id].map((sub) => (
                                <div key={sub.id} className="rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                                  <div className="mb-2 flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-semibold text-brand-ink dark:text-brand-paper">{sub.student.user.fullName}</span>
                                      <span className="ml-2 text-xs text-gray-500">Submitted {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                    {sub.score !== null && (
                                      <span className="text-sm font-bold text-green-600">
                                        {sub.score}/{sub.maxScore ?? 20}
                                      </span>
                                    )}
                                  </div>
                                  {sub.content && <p className="mb-2 text-xs text-gray-600 dark:text-white/70">{sub.content}</p>}
                                  {sub.fileUrl && (
                                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="mb-2 inline-flex items-center gap-1 text-xs text-brand-orange hover:underline">
                                      <FileText className="h-3 w-3" /> Attachment
                                    </a>
                                  )}
                                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                                    <div className="flex-1">
                                      <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Score</label>
                                      <input
                                        type="number" min="0" step="0.25"
                                        value={gradeValues[sub.id]?.score ?? ""}
                                        onChange={(e) => setGradeValues((p) => ({ ...p, [sub.id]: { ...p[sub.id], score: e.target.value, feedback: p[sub.id]?.feedback || "" } }))}
                                        className="input-field !py-1 !text-xs !w-20"
                                        placeholder="Score"
                                      />
                                    </div>
                                    <div className="flex-[2]">
                                      <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Feedback</label>
                                      <textarea
                                        value={gradeValues[sub.id]?.feedback ?? ""}
                                        onChange={(e) => setGradeValues((p) => ({ ...p, [sub.id]: { ...p[sub.id], score: p[sub.id]?.score || "", feedback: e.target.value } }))}
                                        className="input-field !py-1 !text-xs"
                                        rows={1}
                                        placeholder="Feedback..."
                                      />
                                    </div>
                                    <button
                                      onClick={() => onGrade(sub.id)}
                                      disabled={gradingSub[sub.id] || !gradeValues[sub.id]?.score}
                                      className="btn-primary !py-1.5 !text-xs"
                                    >
                                      {gradingSub[sub.id] ? <Spinner className="h-3 w-3" /> : <Save className="h-3 w-3" />}
                                      {sub.score !== null ? "Update" : "Grade"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex justify-center py-4">
                              <Spinner className="h-5 w-5 text-brand-orange" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Homework" size="lg">
        <form onSubmit={onAdd} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Section</label>
            <select required value={formSection} onChange={(e) => setFormSection(e.target.value)} className="input-field">
              <option value="">Choose…</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Subject</label>
              <input required value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="input-field" placeholder="Mathematics" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Due date</label>
              <input required type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Title</label>
            <input required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="input-field" placeholder="Chapter 5 Exercises" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Description</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="input-field" rows={3} placeholder="Assignment details..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">File URL (optional)</label>
            <input value={formFileUrl} onChange={(e) => setFormFileUrl(e.target.value)} className="input-field" placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Spinner /> : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
