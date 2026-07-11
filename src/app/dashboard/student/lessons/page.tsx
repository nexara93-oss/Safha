"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { ChevronDown, ChevronUp, ExternalLink, BookOpen } from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  subject: string;
  content: string;
  fileUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  teacher: { user: { fullName: string } } | null;
  section: { name: string } | null;
};

export default function StudentLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api<{ lessons: Lesson[] }>("/api/lessons")
      .then((d) => setLessons(d.lessons))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load lessons"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell allowedRoles={["STUDENT"]}>
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand-orange" />
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell allowedRoles={["STUDENT"]}>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-sm text-red-500">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary text-sm">Retry</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            Lessons
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">Browse lessons for your section.</p>
        </div>

        {lessons.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <BookOpen className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No lessons available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="card">
                <button
                  onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
                  className="flex w-full items-center justify-between text-start"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-brand-ink dark:text-brand-paper">{lesson.title}</h3>
                      <span className="badge bg-brand-orange/10 text-brand-orange text-xs">{lesson.subject}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {lesson.teacher?.user.fullName ?? "—"} · {new Date(lesson.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {expandedId === lesson.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </button>
                {expandedId === lesson.id && (
                  <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/5">
                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-white/80 whitespace-pre-wrap">
                      {lesson.content || "No content."}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {lesson.fileUrl && (
                        <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-orange hover:underline">
                          <ExternalLink className="h-3 w-3" /> File
                        </a>
                      )}
                      {lesson.videoUrl && (
                        <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-orange hover:underline">
                          <ExternalLink className="h-3 w-3" /> Video
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
