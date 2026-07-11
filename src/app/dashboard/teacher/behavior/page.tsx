"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "@/components/ui/Modal";
import { Plus, Heart, Smile, Frown, Meh } from "lucide-react";

type Student = { id: string; user: { fullName: string }; sectionId: string | null };
type Section = { id: string; name: string };
type Behavior = {
  id: string;
  studentId: string;
  type: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  note: string;
  date: string;
  student: { user: { fullName: string } };
};

export default function TeacherBehaviorPage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [recs, setRecs] = useState<Behavior[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [type, setType] = useState<"POSITIVE" | "NEGATIVE" | "NEUTRAL">("POSITIVE");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionFilter, setSectionFilter] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      api<{ students: Student[] }>("/api/students"),
      api<{ behavior: Behavior[] }>("/api/behavior"),
      api<{ sections: Section[] }>("/api/sections")
    ])
      .then(([s, b, sec]) => {
        setStudents(s.students);
        setRecs(b.behavior);
        setSections(sec.sections);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      error("Choose a student");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/behavior", { method: "POST", json: { studentId, type, note: note.trim() } });
      setNote("");
      setSectionFilter("");
      setOpen(false);
      success("Behavior note added");
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecs = sectionFilter
    ? recs.filter((r) => {
        const student = students.find((s) => s.id === r.studentId);
        return student?.sectionId === sectionFilter;
      })
    : recs;

  const iconFor = (t: string) =>
    t === "POSITIVE" ? <Smile className="h-4 w-4" /> : t === "NEGATIVE" ? <Frown className="h-4 w-4" /> : <Meh className="h-4 w-4" />;
  const colorFor = (t: string) =>
    t === "POSITIVE"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
      : t === "NEGATIVE"
      ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
      : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70";

  return (
    <DashboardShell allowedRoles={["TEACHER"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.behavior")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">Track behavior notes for your students.</p>
          </div>
          <div className="flex items-center gap-2">
            {sections.length > 0 && (
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="input-field !py-2"
              >
                <option value="">All sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <button onClick={() => setOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              {t("common.add")} note
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : recs.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <Heart className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No behavior notes yet.</p>
          </div>
        ) : (
          <div className="card space-y-2 p-3 sm:p-4">
            {filteredRecs.map((b) => (
              <div key={b.id} className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${colorFor(b.type)}`}>
                      {iconFor(b.type)} {b.type}
                    </span>
                    <span className="text-sm font-semibold text-brand-ink dark:text-brand-paper">{b.student.user.fullName}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(b.date).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm text-brand-ink/80 dark:text-brand-paper/80">{b.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setSectionFilter(""); }} title="Add behavior note" size="md">
        <form onSubmit={onAdd} className="space-y-3">
          {sections.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Section</label>
              <select value={sectionFilter} onChange={(e) => { setSectionFilter(e.target.value); setStudentId(""); }} className="input-field">
                <option value="">All sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Student</label>
            <select required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input-field">
              <option value="">Choose…</option>
              {(sectionFilter ? students.filter((s) => s.sectionId === sectionFilter) : students).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { v: "POSITIVE", l: "Positive", icon: Smile, c: "emerald" },
                  { v: "NEUTRAL", l: "Neutral", icon: Meh, c: "gray" },
                  { v: "NEGATIVE", l: "Negative", icon: Frown, c: "red" }
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setType(o.v)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all ${
                    type === o.v
                      ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                      : "border-gray-200 bg-white text-brand-ink/70 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <o.icon className="h-4 w-4" /> {o.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Note</label>
            <textarea
              required
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field resize-y"
              placeholder="Describe the behavior…"
            />
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
