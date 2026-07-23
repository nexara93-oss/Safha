"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "@/components/ui/Modal";
import { Plus, ChevronDown, ChevronUp, Trash2, ExternalLink } from "lucide-react";

type Section = { id: string; name: string };
type Lesson = {
  id: string;
  title: string;
  subject: string;
  content: string;
  fileUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  section: { id: string; name: string; subject: string } | null;
};

export default function TeacherLessonsPage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [sectionId, setSectionId] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api<{ lessons: Lesson[] }>("/api/lessons"),
      api<{ sections: Section[] }>("/api/sections")
    ])
      .then(([l, s]) => {
        setLessons(l.lessons);
        setSections(s.sections);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api("/api/lessons", {
        method: "POST",
        json: { sectionId, subject: subject.trim(), title: title.trim(), content, fileUrl: fileUrl || null, videoUrl: videoUrl || null }
      });
      setSectionId("");
      setSubject("");
      setTitle("");
      setContent("");
      setFileUrl("");
      setVideoUrl("");
      setOpen(false);
      success(t("teacher.lessons.lessonCreated"));
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("common.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm(t("teacher.lessons.deleteConfirm"))) return;
    try {
      await api(`/api/lessons/${id}`, { method: "DELETE" });
      success(t("teacher.lessons.lessonDeleted"));
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("common.failed"));
    }
  };

  const filtered = sectionFilter ? lessons.filter((l) => l.section?.id === sectionFilter) : lessons;

  return (
    <DashboardShell allowedRoles={["TEACHER"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.lessons")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("teacher.lessons.subtitle")}</p>
          </div>
          <div className="flex gap-2">
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
            <button onClick={() => setOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> {t("teacher.lessons.addLesson")}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-12 text-center text-sm text-gray-500">
            {sectionFilter ? t("teacher.lessons.noLessonsSection") : t("teacher.lessons.noLessons")}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((lesson) => (
              <div key={lesson.id} className="card">
                <button
                  onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
                  className="flex w-full items-center justify-between text-start"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-brand-ink dark:text-brand-paper">{lesson.title}</h3>
                      <span className="badge bg-brand-orange/10 text-brand-orange text-xs">{lesson.subject}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {lesson.section?.name ?? "—"} · {new Date(lesson.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(lesson.id); }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {expandedId === lesson.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>
                {expandedId === lesson.id && (
                  <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/5">
                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-white/80 whitespace-pre-wrap">
                      {lesson.content || t("teacher.lessons.noContent")}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {lesson.fileUrl && (
                        <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-orange hover:underline">
                          <ExternalLink className="h-3 w-3" /> {t("teacher.lessons.file")}
                        </a>
                      )}
                      {lesson.videoUrl && (
                        <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-orange hover:underline">
                          <ExternalLink className="h-3 w-3" /> {t("teacher.lessons.video")}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t("teacher.lessons.addLessonTitle")} size="lg">
        <form onSubmit={onAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.section")}</label>
              <select required value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="input-field">
                <option value="">{t("common.choose")}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.subject")}</label>
              <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" placeholder={t("teacher.grades.subjectPlaceholder")} />
            </div>
          </div>
          <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.title")}</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder={t("teacher.lessons.titlePlaceholder")} />
          </div>
          <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.content")}</label>
              <textarea required value={content} onChange={(e) => setContent(e.target.value)} className="input-field min-h-[120px]" placeholder={t("teacher.lessons.contentPlaceholder")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.lessons.fileUrlOptional")}</label>
              <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className="input-field" placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.lessons.videoUrlOptional")}</label>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="input-field" placeholder="https://…" />
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
