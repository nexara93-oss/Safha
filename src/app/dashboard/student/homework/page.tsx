"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "@/components/ui/Modal";
import { FileText, Send, AlertCircle, CheckCircle2, Clock, Ban } from "lucide-react";

type MySubmission = {
  id: string;
  homeworkId: string;
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
  teacher: { user: { fullName: string } };
  submission?: MySubmission | null;
};

type Section = { id: string; name: string };

export default function StudentHomeworkPage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState<string | null>(null);
  const [submitContent, setSubmitContent] = useState("");
  const [submitFileUrl, setSubmitFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ section: Section }>("/api/dashboard/student")
      .then((d) => setSection(d.section))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!section) return;
    setLoading(true);
    api<{ homework: Homework[] }>(`/api/homework?sectionId=${section.id}`)
      .then((d) => setHomeworks(d.homework))
      .catch((e: unknown) => error(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [section]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!submitOpen) return;
    setSubmitting(true);
    try {
      await api("/api/homework-submissions", {
        method: "POST",
        json: {
          homeworkId: submitOpen,
          content: submitContent.trim() || undefined,
          fileUrl: submitFileUrl.trim() || undefined
        }
      });
      success("Submitted");
      setSubmitOpen(null);
      setSubmitContent("");
      setSubmitFileUrl("");
      if (section) {
        const d = await api<{ homework: Homework[] }>(`/api/homework?sectionId=${section.id}`);
        setHomeworks(d.homework);
      }
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatus = (hw: Homework): { label: string; color: string; bg: string; icon: React.ReactNode } => {
    const sub = hw.submission;
    const overdue = new Date(hw.dueDate) < new Date(new Date().toDateString());

    if (sub?.score !== null && sub?.gradedAt) {
      return {
        label: `Graded: ${sub.score}/${sub.maxScore ?? 20}`,
        color: "text-green-700",
        bg: "bg-green-50 dark:bg-green-500/10",
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      };
    }
    if (sub) {
      return {
        label: "Submitted",
        color: "text-yellow-700",
        bg: "bg-yellow-50 dark:bg-yellow-500/10",
        icon: <Clock className="h-4 w-4 text-yellow-500" />
      };
    }
    if (overdue) {
      return {
        label: "Overdue",
        color: "text-red-700",
        bg: "bg-red-50 dark:bg-red-500/10",
        icon: <Ban className="h-4 w-4 text-red-500" />
      };
    }
    return {
      label: "Pending",
      color: "text-gray-600",
      bg: "bg-gray-50 dark:bg-white/5",
      icon: <Clock className="h-4 w-4 text-gray-400" />
    };
  };

  if (loading) {
    return (
      <DashboardShell allowedRoles={["STUDENT"]}>
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand-orange" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("dashboard.homework")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">View and submit your homework assignments.</p>
        </div>

        {homeworks.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <FileText className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No homework assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {homeworks.map((hw) => {
              const status = getStatus(hw);
              return (
                <div key={hw.id} className="card">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-brand-ink dark:text-brand-paper">{hw.title}</h3>
                        <span className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-[10px] font-bold text-brand-orange">{hw.subject}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-white/70">{hw.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>Teacher: {hw.teacher?.user?.fullName || "N/A"}</span>
                        <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                        <span>Section: {hw.section.name}</span>
                      </div>
                      {hw.fileUrl && (
                        <a href={hw.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-brand-orange hover:underline">
                          <FileText className="h-3 w-3" /> Attachment
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      {!hw.submission && !(new Date(hw.dueDate) < new Date(new Date().toDateString())) && (
                        <button onClick={() => setSubmitOpen(hw.id)} className="btn-primary !py-1.5 !text-xs">
                          <Send className="h-3 w-3" /> Submit
                        </button>
                      )}
                    </div>
                  </div>

                  {hw.submission && hw.submission.score !== null && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Feedback</span>
                        <span className="text-xs text-gray-500">
                          Graded {hw.submission.gradedAt ? new Date(hw.submission.gradedAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      {hw.submission.feedback && (
                        <p className="mt-1 text-sm text-gray-700 dark:text-white/80">{hw.submission.feedback}</p>
                      )}
                    </div>
                  )}

                  {hw.submission && !hw.submission.score && (
                    <div className="mt-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-500/5">
                      <p className="text-xs font-semibold text-yellow-700">Submitted — waiting for grading.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!submitOpen} onClose={() => { setSubmitOpen(null); setSubmitContent(""); setSubmitFileUrl(""); }} title="Submit Homework" size="md">
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Your answer</label>
            <textarea value={submitContent} onChange={(e) => setSubmitContent(e.target.value)} className="input-field" rows={4} placeholder="Write your answer here..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">File URL (optional)</label>
            <input value={submitFileUrl} onChange={(e) => setSubmitFileUrl(e.target.value)} className="input-field" placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => { setSubmitOpen(null); setSubmitContent(""); setSubmitFileUrl(""); }} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Spinner /> : "Submit"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
