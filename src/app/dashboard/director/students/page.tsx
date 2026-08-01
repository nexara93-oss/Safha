"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { GraduationCap, BookOpen, CalendarCheck, Heart, Copy, Check } from "lucide-react";
import { EyeIcon } from "@/components/ui/EyeIcon";

type Student = {
  id: string;
  serialNumber: string | null;
  user: { id: string; fullName: string; phone: string | null; status: string };
  teacher: { user: { fullName: string } } | null;
  section: { id: string; name: string } | null;
  grades: { score: number; maxScore: number; subject: string; period: { coefficient: number } }[];
  attendance: { status: string; date: string }[];
  behavior: { type: string; note: string; date: string }[];
};

export default function DirectorStudentsPage() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<Student | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getDefaultPassword = (s: Student) => {
    const base = s.user.fullName.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "").slice(0, 6);
    const last4 = s.user.phone ? s.user.phone.slice(-4) : "1234";
    return (base + last4).slice(0, 10);
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyPassword = async (s: Student) => {
    const pwd = getDefaultPassword(s);
    await navigator.clipboard.writeText(pwd);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    api<{ students: Student[] }>("/api/students")
      .then((d) => setStudents(d.students))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => s.user.fullName.toLowerCase().includes(search.toLowerCase()));

  const avg = (s: Student) => {
    if (s.grades.length === 0) return null;
    const totalCoef = s.grades.reduce((a, g) => a + g.period.coefficient, 0);
    const weighted = s.grades.reduce((a, g) => a + (g.score / g.maxScore) * 20 * g.period.coefficient, 0);
    return totalCoef > 0 ? weighted / totalCoef : null;
  };

  const presentCount = (s: Student) => s.attendance.filter((a) => a.status === "PRESENT").length;
  const absentCount = (s: Student) => s.attendance.filter((a) => a.status === "ABSENT").length;

  return (
    <DashboardShell allowedRoles={["DIRECTOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("dashboard.students")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">
            {t("director.students.subtitle")}
          </p>
        </div>

        <div className="card p-3 sm:p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search") + " students…"}
            className="input-field"
          />
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <GraduationCap className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">{t("director.students.noStudents")}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const a = avg(s);
              return (
                <div key={s.id} className="card group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange/15 text-sm font-bold text-brand-orange">
                        {s.user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-brand-ink dark:text-brand-paper">{s.user.fullName}</div>
                        <div className="truncate text-xs text-gray-500">
                          {s.teacher?.user.fullName || t("director.students.unassigned")} {s.section ? `• ${s.section.name}` : ""}
                        </div>
                      </div>
                    </div>
                    {a !== null && (
                      <div className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${a >= 10 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"}`}>
                        {a.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-white/5">
                      <BookOpen className="h-3 w-3" /> {s.grades.length} {t("director.students.grades")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <CalendarCheck className="h-3 w-3" /> {presentCount(s)} {t("director.students.present")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                      ✕ {absentCount(s)} {t("director.students.absent")}
                    </span>
                    {s.behavior.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        <Heart className="h-3 w-3" /> {s.behavior.length} {t("director.students.notes")}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                    <span className="text-xs text-gray-500">{t("director.students.password")}</span>
                    <code className="flex-1 font-mono text-xs text-brand-ink dark:text-brand-paper">
                      {visiblePasswords.has(s.id) ? getDefaultPassword(s) : "•".repeat(10)}
                    </code>
                    <button type="button" onClick={() => togglePassword(s.id)} className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-brand-ink dark:hover:bg-white/10" aria-label="Toggle password">
                      <EyeIcon visible={visiblePasswords.has(s.id)} className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => copyPassword(s)} className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-brand-ink dark:hover:bg-white/10" aria-label="Copy password">
                      {copiedId === s.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={() => setView(s)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-brand-ink transition-colors hover:border-brand-orange hover:text-brand-orange dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t("director.students.viewDetails")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.user.fullName || t("director.students.student")} size="lg">
        {view && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label={t("director.students.avg")} value={avg(view)?.toFixed(2) ?? "—"} />
              <Stat label={t("director.students.presentLabel")} value={String(presentCount(view))} />
              <Stat label={t("director.students.absentLabel")} value={String(absentCount(view))} />
              <Stat label={t("director.students.notesLabel")} value={String(view.behavior.length)} />
            </div>
            <Section title={t("director.students.gradesTitle")}>
              {view.grades.length === 0 ? (
                <Empty />
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {view.grades.map((g, i) => (
                    <li key={i} className="flex justify-between rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-white/5">
                      <span>{g.subject}</span>
                      <span className="font-bold">
                        {g.score}/{g.maxScore}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section title={t("director.students.behaviorTitle")}>
              {view.behavior.length === 0 ? (
                <Empty />
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {view.behavior.map((b, i) => (
                    <li key={i} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/5">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{b.type}</span>
                        <span>{new Date(b.date).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1">{b.note}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-white/5">
      <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
      <div className="font-display text-xl font-extrabold text-brand-ink dark:text-brand-paper">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-brand-ink dark:text-brand-paper">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  const { t } = useLanguage();
  return <p className="text-sm text-gray-500">{t("director.students.nothingHere")}</p>;
}
