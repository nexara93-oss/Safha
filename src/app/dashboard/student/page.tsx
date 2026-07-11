"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Award, CalendarCheck, Heart, BookOpen, TrendingUp } from "lucide-react";

type StudentData = {
  student: { teacher: { user: { fullName: string } } | null; section: { name: string } | null; serialNumber: string | null };
  grades: { id: string; subject: string; score: number; maxScore: number; period: { name: string; coefficient: number } }[];
  attendance: { status: string; date: string }[];
  behavior: { type: string; note: string; date: string }[];
  periods: { id: string; name: string; startDate: string; endDate: string }[];
  messages: { id: string; content: string; createdAt: string; sender: { fullName: string; role: string } }[];
  periodAverages: { periodId: string; average: number; weightedAverage: number; examCount: number }[];
  overallAverage: number;
};

export default function StudentOverviewPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<StudentData>("/api/dashboard/student")
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <DashboardShell allowedRoles={["STUDENT"]}>
        <div className="flex h-64 items-center justify-center">
          {error ? (
            <div className="text-center">
              <p className="mb-3 text-sm text-red-500">{error}</p>
              <button onClick={() => window.location.reload()} className="btn-primary text-sm">Retry</button>
            </div>
          ) : (
            <Spinner className="h-8 w-8 text-brand-orange" />
          )}
        </div>
      </DashboardShell>
    );
  }

  const present = data.attendance.filter((a) => a.status === "PRESENT").length;
  const absent = data.attendance.filter((a) => a.status === "ABSENT").length;

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            Welcome, {user?.fullName.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">
            {data.student.section ? `${data.student.section.name}` : "Your student dashboard"}
            {data.student.teacher ? ` • ${data.student.teacher.user.fullName}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat icon={TrendingUp} label="Overall avg" value={data.overallAverage.toFixed(2)} color="from-blue-500 to-blue-700" />
          <Stat icon={CalendarCheck} label="Present" value={String(present)} color="from-emerald-500 to-emerald-600" />
          <Stat icon={Award} label="Grades" value={String(data.grades.length)} color="from-indigo-500 to-indigo-600" />
          <Stat icon={Heart} label="Notes" value={String(data.behavior.length)} color="from-pink-500 to-pink-600" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
              <BookOpen className="h-4 w-4" /> Recent grades
            </h2>
            {data.grades.length === 0 ? (
              <p className="text-sm text-gray-500">No grades yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {data.grades.slice(0, 6).map((g) => (
                  <li key={g.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/5">
                    <span>
                      <span className="font-semibold text-brand-ink dark:text-brand-paper">{g.subject}</span>{" "}
                      <span className="text-xs text-gray-500">• {g.period.name}</span>
                    </span>
                    <span className="font-bold">
                      {g.score}/{g.maxScore}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
              <Heart className="h-4 w-4" /> Behavior notes
            </h2>
            {data.behavior.length === 0 ? (
              <p className="text-sm text-gray-500">No behavior notes.</p>
            ) : (
              <ul className="space-y-2">
                {data.behavior.slice(0, 4).map((b, i) => (
                  <li key={i} className="rounded-lg bg-gray-50 p-2.5 text-sm dark:bg-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`badge ${b.type === "POSITIVE" ? "bg-emerald-100 text-emerald-700" : b.type === "NEGATIVE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                        {b.type}
                      </span>
                      <span className="text-gray-500">{new Date(b.date).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1">{b.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {data.messages.length > 0 && (
          <div className="card">
            <h2 className="mb-3 text-sm font-bold text-brand-ink dark:text-brand-paper">Recent messages</h2>
            <ul className="space-y-2">
              {data.messages.slice(0, 3).map((m) => (
                <li key={m.id} className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/5">
                  <div className="text-xs text-gray-500">
                    From {m.sender.fullName} ({m.sender.role.toLowerCase()}) • {new Date(m.createdAt).toLocaleString()}
                  </div>
                  <p className="mt-1">{m.content}</p>
                </li>
              ))}
            </ul>
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
  color
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</div>
          <div className="mt-2 truncate font-display text-2xl font-extrabold text-brand-ink dark:text-brand-paper sm:text-3xl">
            {value}
          </div>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
