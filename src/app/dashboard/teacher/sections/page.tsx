"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, BookOpen } from "lucide-react";

type Section = {
  id: string;
  name: string;
  _count?: { students: number };
};

export default function TeacherSectionsPage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api<{ sections: Section[] }>("/api/sections")
      .then((d) => setSections(d.sections))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api("/api/sections", { method: "POST", json: { name: name.trim() } });
      setName("");
      setOpen(false);
      success(t("teacher.sections.sectionAdded"));
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("common.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(t("teacher.sections.deleteConfirm", { name }))) return;
    try {
      await api(`/api/sections/${id}`, { method: "DELETE" });
      success(t("teacher.sections.sectionDeleted"));
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("teacher.sections.deleteFailed"));
    }
  };

  return (
    <DashboardShell allowedRoles={["TEACHER"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.sections")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("teacher.sections.subtitle")}</p>
          </div>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            {t("common.add")} {t("teacher.sections.section")}
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : sections.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <BookOpen className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">{t("teacher.sections.noSections")}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => (
              <div key={s.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-semibold text-brand-ink dark:text-brand-paper">{s.name}</div>
                  <div className="text-xs text-gray-500">{t("teacher.sections.studentsCount", { count: s._count?.students ?? 0 })}</div>
                </div>
                <button
                  onClick={() => onDelete(s.id, s.name)}
                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t("teacher.sections.addSectionTitle")} size="sm">
        <form onSubmit={onAdd} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.sections.sectionName")}</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="4ème A"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Spinner /> : t("common.add")}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
