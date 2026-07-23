"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, X, CalendarCheck } from "lucide-react";

type Student = { id: string; user: { fullName: string }; sectionId: string | null };
type AttendanceRec = { studentId: string; status: string; date: string };
type Section = { id: string; name: string };

function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function TeacherAttendancePage() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [recs, setRecs] = useState<AttendanceRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(localDateStr);
  const [saving, setSaving] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionFilter, setSectionFilter] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      api<{ students: Student[] }>("/api/students"),
      api<{ attendance: AttendanceRec[] }>("/api/attendance"),
      api<{ sections: Section[] }>("/api/sections")
    ])
      .then(([s, a, sec]) => {
        setStudents(s.students);
        setRecs(a.attendance);
        setSections(sec.sections);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = sectionFilter
    ? students.filter((s) => s.sectionId === sectionFilter)
    : students;

  const status = (sid: string) => {
    const r = recs.find((x) => x.studentId === sid && x.date && localDateStr(new Date(x.date)) === date);
    return r?.status as "PRESENT" | "ABSENT" | undefined;
  };

  const mark = async (studentId: string, status: "PRESENT" | "ABSENT") => {
    setSaving(studentId);
    try {
      const res = await api<{ attendance: AttendanceRec }>("/api/attendance", {
        method: "POST",
        json: { studentId, date, status }
      });
      // Update local
      setRecs((prev) => {
        const without = prev.filter((r) => !(r.studentId === studentId && localDateStr(new Date(r.date)) === date));
        return [...without, res.attendance];
      });
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : t("common.failed"));
    } finally {
      setSaving(null);
    }
  };

  const present = filtered.filter((s) => status(s.id) === "PRESENT").length;
  const absent = filtered.filter((s) => status(s.id) === "ABSENT").length;

  return (
    <DashboardShell allowedRoles={["TEACHER"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("dashboard.attendance")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("teacher.attendance.subtitle")}</p>
        </div>

        <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-brand-orange" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field !py-2" />
            {sections.length > 0 && (
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="input-field !py-2"
              >
                <option value="">{t("common.allSections")}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              {present} {t("attendance.present")}
            </span>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-bold text-red-700 dark:bg-red-500/15 dark:text-red-400">
              {absent} {t("attendance.absent")}
            </span>
            <span className="text-gray-500">{filtered.length} {t("teacher.attendance.total")}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : students.length === 0 ? (
          <div className="card py-10 text-center text-sm text-gray-500">{t("teacher.attendance.noStudents")}</div>
        ) : (
          <div className="card space-y-2 p-3 sm:p-4">
            {filtered.map((s) => {
              const st = status(s.id);
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-white/5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-orange/15 text-xs font-bold text-brand-orange">
                      {s.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate font-semibold text-brand-ink dark:text-brand-paper">{s.user.fullName}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => mark(s.id, "PRESENT")}
                      disabled={saving === s.id}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        st === "PRESENT"
                          ? "bg-emerald-500 text-white"
                          : "border border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" /> P
                    </button>
                    <button
                      onClick={() => mark(s.id, "ABSENT")}
                      disabled={saving === s.id}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        st === "ABSENT"
                          ? "bg-red-500 text-white"
                          : "border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                      }`}
                    >
                      <X className="h-3.5 w-3.5" /> A
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
