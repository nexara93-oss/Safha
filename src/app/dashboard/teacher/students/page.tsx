"use client";

import { useEffect, useState, FormEvent, lazy, Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "@/components/ui/Modal";
import { Plus, Upload, GraduationCap } from "lucide-react";
import { StudentCard, EmptyState } from "@/components/students/StudentCard";
import { CredentialsDisplay } from "@/components/ui/CredentialsDisplay";

type Student = {
  id: string;
  serialNumber: string | null;
  user: { id: string; fullName: string; email: string | null; phone: string | null };
};

const PdfImportModal = lazy(() => import("@/components/students/PdfImportModal"));

export default function TeacherStudentsPage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [credOpen, setCredOpen] = useState(false);
  const [credStudent, setCredStudent] = useState<Student | null>(null);
  const [credEmail, setCredEmail] = useState("");
  const [credPwd, setCredPwd] = useState("");
  const [resetting, setResetting] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    api<{ students: Student[] }>("/api/students")
      .then((d) => setStudents(d.students))
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : t("common.failed")))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const loadSections = () => {
    api<{ sections: { id: string; name: string }[] }>("/api/sections")
      .then((d) => setSections(d.sections))
      .catch(() => {});
  };

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api<{ email: string; defaultPassword: string }>("/api/students", {
        method: "POST",
        json: { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || undefined, serialNumber: serialNumber.trim() || undefined, sectionId: sectionId || undefined }
      });
      success(t("teacher.students.studentAdded"));
      setFirstName("");
      setLastName("");
      setPhone("");
      setSerialNumber("");
      setSectionId("");
      setOpen(false);
      load();
      setCredStudent({ id: "new", serialNumber: null, user: { id: "new", fullName: `${firstName.trim()} ${lastName.trim()}`, email: res.email, phone: null } });
      setCredEmail(res.email);
      setCredPwd(res.defaultPassword);
      setCredOpen(true);
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("common.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(t("teacher.students.deleteConfirm", { name }))) return;
    try {
      await api(`/api/students/${id}`, { method: "DELETE" });
      success(t("teacher.students.studentDeleted"));
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("teacher.students.deleteFailed"));
    }
  };

  const openCredentials = (s: Student) => {
    setCredStudent(s);
    setCredEmail(s.user.email || "");
    setCredPwd("");
    setCredOpen(true);
  };

  const openCredsById = (id: string) => {
    const s = students.find((st) => st.id === id);
    if (s) openCredentials(s);
  };

  const resetPassword = async () => {
    if (!credStudent) return;
    setResetting(true);
    try {
      const res = await api<{ email: string; password: string }>(`/api/students/${credStudent.id}`, {
        method: "PATCH",
        json: { action: "resetPassword" }
      });
      setCredEmail(res.email);
      setCredPwd(res.password);
      success(t("teacher.students.passwordReset"));
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("common.failed"));
    } finally {
      setResetting(false);
    }
  };

  return (
    <DashboardShell allowedRoles={["TEACHER"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.students")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("teacher.students.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPdfOpen(true)} className="btn-secondary">
              <Upload className="h-4 w-4" />
              {t("teacher.students.importPdf")}
            </button>
            <button onClick={() => { setOpen(true); loadSections(); }} className="btn-primary">
              <Plus className="h-4 w-4" />
              {t("common.add")}
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
        ) : students.length === 0 ? (
          <EmptyState icon={GraduationCap} message={t("teacher.students.noStudents")} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((s) => (
              <StudentCard
                key={s.id}
                id={s.id}
                fullName={s.user.fullName}
                email={s.user.email}
                phone={s.user.phone}
                serialNumber={s.serialNumber}
                onDelete={onDelete}
                onCredentials={openCredsById}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add manual */}
      <Modal open={open} onClose={() => setOpen(false)} title={t("teacher.students.addStudentTitle")} size="md">
        <form onSubmit={onAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.students.firstName")}</label>
              <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-field" placeholder="Youssef" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.students.lastName")}</label>
              <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-field" placeholder="Amrani" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.phone")}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+212 6 12 34 56 78" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("teacher.students.serialNumber")}</label>
              <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="input-field" placeholder="1" />
            </div>
          </div>
          {sections.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("common.section")}</label>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="input-field">
                <option value="">{t("teacher.students.noSection")}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="rounded-xl bg-brand-cream p-3 text-xs text-brand-ink/70 dark:bg-white/5 dark:text-white/70">
            {t("teacher.students.emailPasswordInfo")}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Spinner /> : t("common.add")}
            </button>
          </div>
        </form>
      </Modal>

      {pdfOpen && (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Spinner /></div>}>
          <PdfImportModal open={pdfOpen} onClose={() => setPdfOpen(false)} onImported={load} />
        </Suspense>
      )}

      {/* Credentials modal */}
      <Modal open={credOpen} onClose={() => setCredOpen(false)} title={t("teacher.students.credentialsTitle")} size="sm">
        {credStudent && (
          <CredentialsDisplay
            fullName={credStudent.user.fullName}
            email={credEmail}
            password={credPwd}
            onReset={resetPassword}
            resetting={resetting}
          />
        )}
      </Modal>
    </DashboardShell>
  );
}
