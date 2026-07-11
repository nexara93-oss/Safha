"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { FileText, Printer } from "lucide-react";

type StudentData = {
  student: { teacher: { user: { fullName: string } } | null; section: { name: string } | null; serialNumber: string | null };
  grades: { id: string; subject: string; score: number; maxScore: number; period: { name: string; coefficient: number; id: string } }[];
  periods: { id: string; name: string; startDate: string; endDate: string }[];
  periodAverages: { periodId: string; average: number; weightedAverage: number; examCount: number }[];
  overallAverage: number;
};

export default function StudentReportCardPage() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<StudentData>("/api/dashboard/student")
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load report card"))
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

  const gradesByPeriod = data.periods.map((p) => ({
    period: p,
    grades: data.grades.filter((g) => g.period.id === p.id),
    average: data.periodAverages.find((pa) => pa.periodId === p.id)?.average ?? 0,
    weightedAverage: data.periodAverages.find((pa) => pa.periodId === p.id)?.weightedAverage ?? 0,
  }));

  const handlePrint = () => window.print();

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between no-print">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              Report Card
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">Academic performance summary</p>
          </div>
          <button onClick={handlePrint} className="btn-primary text-sm">
            <Printer className="h-4 w-4" /> Download PDF
          </button>
        </div>

        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 1.5cm; }
          }
        `}</style>

        {data.grades.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No grades recorded yet. Report card will be available once grades are entered.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-brand-orange to-blue-700 px-6 py-5 text-white shadow-lg shadow-brand-orange/30 print:bg-gradient-to-br print:from-brand-orange print:to-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-90">Student</div>
                  <div className="font-display text-xl font-extrabold">{data.student.section?.name || "N/A"}</div>
                  {data.student.teacher && (
                    <div className="mt-1 text-xs opacity-80">Teacher: {data.student.teacher.user.fullName}</div>
                  )}
                </div>
                <div className="text-end">
                  <div className="text-xs font-bold uppercase tracking-wider opacity-90">Overall average</div>
                  <div className="font-display text-4xl font-extrabold">{data.overallAverage.toFixed(2)}</div>
                  <div className="text-xs opacity-80">/ 20</div>
                </div>
              </div>
            </div>

            {gradesByPeriod.map(({ period, grades, average, weightedAverage }) => (
              <div key={period.id} className="card">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-brand-ink dark:text-brand-paper">{period.name}</h2>
                    <p className="text-xs text-gray-500">
                      {new Date(period.startDate).toLocaleDateString()} → {new Date(period.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-end">
                    <div className="text-xs text-gray-500">Period average</div>
                    <div className="font-display text-2xl font-extrabold text-brand-orange">{average.toFixed(2)}</div>
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-white/10">
                      <th className="pb-2 pr-2">Subject</th>
                      <th className="pb-2 px-2">Score</th>
                      <th className="pb-2 pl-2 text-end">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g) => (
                      <tr key={g.id} className="border-b border-gray-50 dark:border-white/5">
                        <td className="py-2 pr-2 font-semibold text-brand-ink dark:text-brand-paper">{g.subject}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold">{g.score}</span>
                            <span className="text-xs text-gray-400">/ {g.maxScore}</span>
                          </div>
                        </td>
                        <td className="py-2 pl-2 text-end">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                            g.score / g.maxScore >= 0.8 ? "bg-emerald-100 text-emerald-700" :
                            g.score / g.maxScore >= 0.5 ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {g.score / g.maxScore >= 0.8 ? "Excellent" :
                             g.score / g.maxScore >= 0.5 ? "Passing" :
                             "Needs improvement"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-white/10">
                  <span>Weighted average: {weightedAverage.toFixed(2)}</span>
                  <span>{grades.length} exam(s)</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
