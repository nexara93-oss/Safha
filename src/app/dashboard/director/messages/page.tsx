"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Send, MessageSquare, Users, GraduationCap } from "lucide-react";

type Msg = {
  id: string;
  content: string;
  createdAt: string;
  recipientType: string;
  sender: { id: string; fullName: string; role: string };
};

type Teacher = { id: string; user: { fullName: string } };
type Student = { id: string; user: { fullName: string } };

export default function DirectorMessagesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientType, setRecipientType] = useState<"TEACHER" | "STUDENT" | "ALL_TEACHERS" | "ALL_STUDENTS">("ALL_TEACHERS");
  const [recipientId, setRecipientId] = useState<string>("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api<{ messages: Msg[] }>("/api/messages"),
      api<{ teachers: Teacher[] }>("/api/teachers"),
      api<{ students: { id: string; user: { fullName: string } }[] }>("/api/students")
    ])
      .then(([m, t2, s2]) => {
        setMessages(m.messages);
        setTeachers(t2.teachers);
        setStudents(s2.students);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if ((recipientType === "TEACHER" || recipientType === "STUDENT") && !recipientId) {
      error("Please choose a recipient");
      return;
    }
    setSending(true);
    try {
      await api("/api/messages", {
        method: "POST",
        json: {
          recipientType,
          recipientId: recipientType === "TEACHER" || recipientType === "STUDENT" ? recipientId : null,
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

  const recipientOptions = recipientType === "TEACHER" ? teachers : recipientType === "STUDENT" ? students : [];

  return (
    <DashboardShell allowedRoles={["DIRECTOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("dashboard.messages")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("msg.subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Compose */}
          <form onSubmit={onSend} className="card space-y-3">
            <h2 className="text-sm font-bold text-brand-ink dark:text-brand-paper">{t("msg.newMessage")}</h2>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">{t("msg.sendTo")}</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { v: "ALL_TEACHERS", l: t("msg.allTeachers"), icon: Users },
                    { v: "ALL_STUDENTS", l: t("msg.allStudents"), icon: GraduationCap },
                    { v: "TEACHER", l: t("msg.oneTeacher"), icon: Users },
                    { v: "STUDENT", l: t("msg.oneStudent"), icon: GraduationCap }
                  ] as const
                ).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => {
                      setRecipientType(o.v);
                      setRecipientId("");
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                      recipientType === o.v
                        ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                        : "border-gray-200 bg-white text-brand-ink/70 hover:border-brand-orange dark:border-white/15 dark:bg-white/[0.07] dark:text-white/70"
                    }`}
                  >
                    <o.icon className="h-3.5 w-3.5" /> {o.l}
                  </button>
                ))}
              </div>
            </div>
            {recipientOptions.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">{t("msg.recipient")}</label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  <option value="">{t("msg.choose")}</option>
                  {recipientOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.user.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">{t("msg.message")}</label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-field resize-y"
                placeholder={t("msg.placeholder")}
              />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full">
              {sending ? <Spinner /> : (
                <>
                  <Send className="h-4 w-4" />
                  {t("common.send")}
                </>
              )}
            </button>
          </form>

          {/* Inbox */}
          <div className="card">
            <h2 className="mb-3 text-sm font-bold text-brand-ink dark:text-brand-paper">{t("msg.inbox")}</h2>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner className="h-6 w-6 text-brand-orange" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-500">
                <MessageSquare className="h-8 w-8 text-gray-300" />
                {t("msg.empty")}
              </div>
            ) : (
              <ul className="space-y-2 max-h-[500px] overflow-y-auto">
                {messages.map((m) => {
                  const fromMe = m.sender.id === user?.id;
                  return (
                    <li
                      key={m.id}
                      className={`rounded-2xl p-3 ${
                        fromMe
                          ? "ms-12 bg-brand-orange/10"
                          : "me-12 bg-gray-50 dark:bg-white/[0.07]"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-ink dark:text-brand-paper">
                          {fromMe ? t("msg.you") : m.sender.fullName} <span className="font-normal text-gray-500">({m.sender.role.toLowerCase()})</span>
                        </span>
                        <span className="text-gray-400">{new Date(m.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-brand-ink dark:text-brand-paper">{m.content}</p>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
                        {t("msg.to")}: {m.recipientType.replace("_", " ").toLowerCase()}
                      </div>
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
