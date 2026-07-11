"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Send, MessageSquare, Users, GraduationCap, ShieldCheck } from "lucide-react";

type Msg = {
  id: string;
  content: string;
  createdAt: string;
  recipientType: string;
  sender: { id: string; fullName: string; role: string };
};

type Student = { id: string; user: { fullName: string } };

export default function TeacherMessagesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientType, setRecipientType] = useState<"DIRECTOR" | "STUDENT" | "ALL_STUDENTS">("DIRECTOR");
  const [recipientId, setRecipientId] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api<{ messages: Msg[] }>("/api/messages"), api<{ students: Student[] }>("/api/students")])
      .then(([m, s]) => {
        setMessages(m.messages);
        setStudents(s.students);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (recipientType === "STUDENT" && !recipientId) {
      error("Choose a student");
      return;
    }
    setSending(true);
    try {
      await api("/api/messages", {
        method: "POST",
        json: {
          recipientType,
          recipientId: recipientType === "STUDENT" ? recipientId : null,
          content: content.trim()
        }
      });
      setContent("");
      success("Message sent");
      load();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardShell allowedRoles={["TEACHER"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("dashboard.messages")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">Talk to your director and students.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={onSend} className="card space-y-3">
            <h2 className="text-sm font-bold text-brand-ink dark:text-brand-paper">New message</h2>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Send to</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { v: "DIRECTOR", l: "Director", icon: ShieldCheck },
                    { v: "ALL_STUDENTS", l: "All students", icon: Users },
                    { v: "STUDENT", l: "One student", icon: GraduationCap }
                  ] as const
                ).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => { setRecipientType(o.v); setRecipientId(""); }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                      recipientType === o.v
                        ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                        : "border-gray-200 bg-white text-brand-ink/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
                    }`}
                  >
                    <o.icon className="h-3.5 w-3.5" /> {o.l}
                  </button>
                ))}
              </div>
            </div>
            {recipientType === "STUDENT" && (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Student</label>
                <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="input-field">
                  <option value="">Choose…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.user.fullName}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Message</label>
              <textarea required rows={5} value={content} onChange={(e) => setContent(e.target.value)} className="input-field resize-y" placeholder="Type your message…" />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full">
              {sending ? <Spinner /> : <><Send className="h-4 w-4" />{t("common.send")}</>}
            </button>
          </form>

          <div className="card">
            <h2 className="mb-3 text-sm font-bold text-brand-ink dark:text-brand-paper">Inbox</h2>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner className="h-6 w-6 text-brand-orange" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-500">
                <MessageSquare className="h-8 w-8 text-gray-300" />
                No messages yet
              </div>
            ) : (
              <ul className="space-y-2 max-h-[500px] overflow-y-auto">
                {messages.map((m) => {
                  const fromMe = m.sender.id === user?.id;
                  return (
                    <li
                      key={m.id}
                      className={`rounded-2xl p-3 ${fromMe ? "ms-12 bg-brand-orange/10" : "me-12 bg-gray-50 dark:bg-white/5"}`}
                    >
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-ink dark:text-brand-paper">
                          {fromMe ? "You" : m.sender.fullName} <span className="font-normal text-gray-500">({m.sender.role.toLowerCase()})</span>
                        </span>
                        <span className="text-gray-400">{new Date(m.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-brand-ink dark:text-brand-paper">{m.content}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
