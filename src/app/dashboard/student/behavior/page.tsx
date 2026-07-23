"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, Smile, Frown, Meh } from "lucide-react";

type Note = {
  id: string;
  type: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  note: string;
  date: string;
  teacher: { user: { fullName: string } };
};

export default function StudentBehaviorPage() {
  const { t } = useLanguage();
  const [recs, setRecs] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ behavior: Note[] }>("/api/behavior")
      .then((d) => setRecs(d.behavior))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load behavior notes"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell allowedRoles={["STUDENT"]}>
        <div className="flex h-64 items-center justify-center">
          {error ? (
            <div className="text-center">
              <p className="mb-3 text-sm text-red-500">{error}</p>
              <button onClick={() => window.location.reload()} className="btn-primary text-sm">{t("student.behavior.retry")}</button>
            </div>
          ) : (
            <Spinner className="h-8 w-8 text-brand-orange" />
          )}
        </div>
      </DashboardShell>
    );
  }

  const iconFor = (t: string) => (t === "POSITIVE" ? <Smile className="h-4 w-4" /> : t === "NEGATIVE" ? <Frown className="h-4 w-4" /> : <Meh className="h-4 w-4" />);

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("student.behavior.title")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("student.behavior.subtitle")}</p>
        </div>

        {recs.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <Heart className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">{t("student.behavior.noNotes")}</p>
          </div>
        ) : (
          <div className="card space-y-2 p-3 sm:p-4">
            {recs.map((b) => (
              <div key={b.id} className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        b.type === "POSITIVE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : b.type === "NEGATIVE"
                          ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                          : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70"
                      }`}
                    >
                      {iconFor(b.type)} {b.type}
                    </span>
                    <span className="text-xs text-gray-500">{b.teacher.user.fullName}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(b.date).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm text-brand-navy/90 dark:text-white/90">{b.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
