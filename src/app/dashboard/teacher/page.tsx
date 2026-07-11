"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, CalendarCheck, CalendarX, Users, GraduationCap, BookOpen } from "lucide-react";

type Teacher = {
  id: string;
  subject: string;
  user: { fullName: string };
  students: { id: string; user: { fullName: string; phone: string | null } }[];
  sections: { id: string; name: string; _count: { students: number } }[];
  grades: unknown[];
};

type TodayAttendance = { status: "PRESENT" | "ABSENT" } | null;
type TodayStudentAttendance = { studentId: string; status: string }[];

export default function TeacherOverviewPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [today, setToday] = useState<TodayAttendance>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<"PRESENT" | "ABSENT" | null>(null);

  const load = () => {
    setLoading(true);
    api<{ teacher: Teacher; todayAttendance: TodayAttendance }>("/api/dashboard/teacher")
      .then((d) => {
        setTeacher(d.teacher);
        setToday(d.todayAttendance);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const mark = async (status: "PRESENT" | "ABSENT") => {
    setMarking(status);
    try {
      await api("/api/teacher-attendance", { method: "POST", json: { status } });
      setToday({ status });
      success(`Marked ${status.toLowerCase()} for today`);
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Failed");
    } finally {
      setMarking(null);
    }
  };

  if (loading || !teacher) {
    return (
      <DashboardShell allowedRoles={["TEACHER"]}>
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand-orange" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell allowedRoles={["TEACHER"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("dashboard.overview")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">
            {user?.fullName} • {teacher.subject}
          </p>
        </div>

        {/* Self attendance */}
        <div className="card">
          <h2 className="mb-3 text-base font-bold text-brand-ink dark:text-brand-paper">My attendance — today</h2>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => mark("PRESENT")}
                disabled={marking !== null}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all sm:flex-none ${
                  today?.status === "PRESENT"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-gray-200 bg-white text-emerald-600 hover:border-emerald-500 dark:border-white/10 dark:bg-white/5"
                }`}
              >
                <Check className="h-4 w-4" />
                {today?.status === "PRESENT" ? "Present today" : "Mark present"}
              </button>
              <button
                onClick={() => mark("ABSENT")}
                disabled={marking !== null}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all sm:flex-none ${
                  today?.status === "ABSENT"
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-gray-200 bg-white text-red-600 hover:border-red-500 dark:border-white/10 dark:bg-white/5"
                }`}
              >
                <X className="h-4 w-4" />
                {today?.status === "ABSENT" ? "Absent today" : "Mark absent"}
              </button>
            </div>
            {!today && <p className="text-xs text-gray-500">You haven't marked your attendance yet.</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <Stat icon={GraduationCap} label="Students" value={teacher.students.length} color="from-indigo-500 to-indigo-600" />
          <Stat icon={BookOpen} label="Sections" value={teacher.sections.length} color="from-emerald-500 to-emerald-600" />
          <Stat icon={Users} label="Subject" value={teacher.subject} color="from-blue-500 to-blue-700" small />
        </div>

        {teacher.sections.length > 0 && (
          <div className="card">
            <h2 className="mb-3 text-base font-bold text-brand-ink dark:text-brand-paper">My sections</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {teacher.sections.map((s) => (
                <div key={s.id} className="rounded-xl border border-gray-100 bg-white p-3 dark:border-white/5 dark:bg-white/5">
                  <div className="font-semibold text-brand-ink dark:text-brand-paper">{s.name}</div>
                  <div className="text-xs text-gray-500">{s._count.students} students</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
  small
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</div>
          <div className={`mt-2 truncate font-display font-extrabold text-brand-ink dark:text-brand-paper ${small ? "text-xl" : "text-3xl"}`}>
            {value}
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
