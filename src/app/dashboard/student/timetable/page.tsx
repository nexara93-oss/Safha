"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { Clock } from "lucide-react";

type Slot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  room: string | null;
  teacher: { user: { fullName: string } };
};

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function StudentTimetablePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ slots: Slot[] }>("/api/student/timetable")
      .then((d) => setSlots(d.slots))
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

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            My timetable
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">Your weekly class schedule.</p>
        </div>

        {slots.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <Clock className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No timetable assigned yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[700px] grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <div key={day} className="card p-2">
                  <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {day.slice(0, 3)}
                  </div>
                  <div className="space-y-1">
                    {slots
                      .filter((s) => s.day === day)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((s) => (
                        <div
                          key={s.id}
                          className="rounded-lg bg-brand-orange/10 p-1.5 text-center text-[10px] leading-tight"
                        >
                          <div className="font-bold text-brand-orange">{s.subject}</div>
                          <div className="text-gray-500">{s.startTime.slice(0, 5)}-{s.endTime.slice(0, 5)}</div>
                          <div className="text-gray-400">{s.teacher.user.fullName.split(" ")[0]}</div>
                          {s.room && <div className="text-gray-400">{s.room}</div>}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
