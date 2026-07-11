"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Clock, Plus, Trash2, AlertCircle } from "lucide-react";

type Slot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  room: string | null;
  teacher: { id: string; user: { fullName: string } };
  section: { id: string; name: string };
};

type Teacher = { id: string; user: { fullName: string } };
type Section = { id: string; name: string };

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function DirectorTimetablePage() {
  const { t } = useLanguage();
  const { success, error: toastError } = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDay, setFilterDay] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterSection, setFilterSection] = useState("");

  const [day, setDay] = useState("MONDAY");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [subject, setSubject] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [room, setRoom] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api<{ slots: Slot[] }>("/api/timetable"),
      api<{ teachers: Teacher[] }>("/api/teachers"),
      api<{ sections: Section[] }>("/api/sections")
    ])
      .then(([s, t, sec]) => {
        setSlots(s.slots);
        setTeachers(t.teachers);
        setSections(sec.sections);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !teacherId || !sectionId) {
      toastError("Please fill in all required fields");
      return;
    }
    setAdding(true);
    try {
      const res = await api<{ slot: Slot }>("/api/timetable", {
        method: "POST",
        json: { day, startTime, endTime, subject: subject.trim(), teacherId, sectionId, room: room.trim() || null }
      });
      setSlots((prev) => [...prev, res.slot]);
      setSubject("");
      setRoom("");
      success("Timetable slot added");
    } catch (e: unknown) {
      toastError(e instanceof Error ? e.message : "Failed to add slot");
    } finally {
      setAdding(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await api(`/api/timetable/${id}`, { method: "DELETE" });
      setSlots((prev) => prev.filter((s) => s.id !== id));
      success("Slot deleted");
    } catch (e: unknown) {
      toastError(e instanceof Error ? e.message : "Failed to delete slot");
    }
  };

  const filtered = slots.filter((s) => {
    if (filterDay && s.day !== filterDay) return false;
    if (filterTeacher && s.teacher.id !== filterTeacher) return false;
    if (filterSection && s.section.id !== filterSection) return false;
    return true;
  });

  if (loading) {
    return (
      <DashboardShell allowedRoles={["DIRECTOR"]}>
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

  return (
    <DashboardShell allowedRoles={["DIRECTOR"]}>
      <div className="space-y-6">
        <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.timetable")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("timetable.manageSlots")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Add form */}
          <form onSubmit={onAdd} className="card space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-brand-ink dark:text-brand-paper">
              <Plus className="h-4 w-4 text-brand-orange" /> Add slot
            </h2>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("common.day")}</label>
              <select value={day} onChange={(e) => setDay(e.target.value)} className="input-field cursor-pointer">
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("common.time")}</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("common.time")}</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("common.subject")} *</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" placeholder={t("timetable.subjectPlaceholder")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("dashboard.teachers")} *</label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="input-field cursor-pointer">
                <option value="">{t("timetable.selectTeacher")}</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.user.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("dashboard.sections")} *</label>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="input-field cursor-pointer">
                <option value="">{t("timetable.selectSection")}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("common.room")}</label>
              <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} className="input-field" placeholder={t("timetable.roomPlaceholder")} />
            </div>
            <button type="submit" disabled={adding} className="btn-primary w-full">
              {adding ? <Spinner /> : <><Plus className="h-4 w-4" /> Add</>}
            </button>
          </form>

          {/* Slots list */}
          <div className="card space-y-3 p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
              <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="input-field !py-1.5 text-xs">
                <option value="">{t("timetable.allDays")}</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="input-field !py-1.5 text-xs">
                <option value="">{t("timetable.allTeachers")}</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.user.fullName}</option>
                ))}
              </select>
              <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="input-field !py-1.5 text-xs">
                <option value="">{t("timetable.allSections")}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-500">
                <Clock className="h-8 w-8 text-gray-300" />
                {t("timetable.noSlots")}
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {filtered.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5 text-sm dark:bg-white/5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-brand-ink dark:text-brand-paper">{s.subject}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400">{s.day}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {s.startTime.slice(0, 5)}-{s.endTime.slice(0, 5)} • {s.teacher.user.fullName} • {s.section.name}{s.room ? ` • ${s.room}` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(s.id)}
                      className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10"
                      aria-label="Delete slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
