"use client";

import { useEffect, useState, useMemo, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Plus, Users, Eye, EyeOff, Copy, Check, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TeacherTableRow, TeacherMobileCard } from "@/components/teachers/TeacherRow";
import { CredentialsDisplay } from "@/components/ui/CredentialsDisplay";

type Teacher = {
  id: string;
  subject: string;
  user: { id: string; fullName: string; email: string | null; status: string };
  _count?: { students: number; sections: number };
  generatedPassword?: string;
};

export default function DirectorTeachersPage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [subject, setSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<{ id: string; kind: "email" | "password" } | null>(null);

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyCell = async (text: string, id: string, kind: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField({ id, kind });
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      error("Could not copy");
    }
  };

  const load = () => {
    setLoading(true);
    api<{ teachers: Teacher[] }>("/api/teachers")
      .then((d) => setTeachers(d.teachers))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api<{ credentials: { email: string; password: string } }>("/api/teachers", {
        method: "POST",
        json: { firstName: firstName.trim(), lastName: lastName.trim(), subject: subject.trim() }
      });
      setCreatedCreds({ email: res.credentials.email, password: res.credentials.password, name: `${firstName} ${lastName}` });
      setFirstName("");
      setLastName("");
      setSubject("");
      success("Teacher added. Share the credentials below.");
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Delete teacher ${name}? This cannot be undone.`)) return;
    try {
      await api(`/api/teachers/${id}`, { method: "DELETE" });
      success("Teacher deleted");
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const filtered = useMemo(() =>
    teachers.filter((t) =>
      t.user.fullName.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase())
    ),
    [teachers, search]
  );

  return (
    <DashboardShell allowedRoles={["DIRECTOR"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.teachers")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">
              Add teachers and share auto-generated credentials.
            </p>
          </div>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            {t("common.add")} teacher
          </button>
        </div>

        <div className="card p-3 sm:p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search") + " teachers…"}
            className="input-field"
          />
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <Users className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No teachers yet. Click "Add teacher" to get started.</p>
          </div>
        ) : (
          <>
            <div className="card hidden overflow-hidden p-0 sm:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-start text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-start">Name</th>
                    <th className="px-4 py-3 text-start">Subject</th>
                    <th className="px-4 py-3 text-start">Email</th>
                    <th className="px-4 py-3 text-start">Password</th>
                    <th className="px-4 py-3 text-start">Students</th>
                    <th className="px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tch) => (
                    <TeacherTableRow
                      key={tch.id}
                      id={tch.id}
                      fullName={tch.user.fullName}
                      subject={tch.subject}
                      email={tch.user.email}
                      generatedPassword={tch.generatedPassword}
                      studentCount={tch._count?.students ?? 0}
                      visiblePasswords={visiblePasswords}
                      copiedField={copiedField}
                      onDelete={onDelete}
                      onTogglePassword={togglePassword}
                      onCopyCell={copyCell}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 sm:hidden">
              {filtered.map((tch) => (
                <TeacherMobileCard
                  key={tch.id}
                  id={tch.id}
                  fullName={tch.user.fullName}
                  subject={tch.subject}
                  email={tch.user.email}
                  generatedPassword={tch.generatedPassword}
                  studentCount={tch._count?.students ?? 0}
                  visiblePasswords={visiblePasswords}
                  copiedField={copiedField}
                  onDelete={onDelete}
                  onTogglePassword={togglePassword}
                  onCopyCell={copyCell}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={createdCreds ? "Teacher added" : "Add teacher"} size="md">
        {createdCreds ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <strong>{createdCreds.name}</strong> has been added. Share these credentials with them — they won't be shown again.
            </div>
            <CredentialsDisplay fullName={createdCreds.name} email={createdCreds.email} password={createdCreds.password} />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setOpen(false); setCreatedCreds(null); }} className="btn-primary">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={onAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">First name</label>
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="Mounia"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Last name</label>
                <input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Tazi"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-brand-ink dark:text-brand-paper">Subject</label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
                placeholder="Mathematics"
              />
            </div>
            <div className="rounded-xl bg-brand-cream p-3 text-xs text-brand-ink/70 dark:bg-white/5 dark:text-white/70">
              We'll auto-generate a unique email and 10-character password for this teacher.
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
        )}
      </Modal>
    </DashboardShell>
  );
}
