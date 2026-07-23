"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Send, MessageSquare } from "lucide-react";

type Msg = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; fullName: string; role: string };
};

export default function StudentMessagesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    api<{ messages: Msg[] }>("/api/messages")
      .then((d) => setMessages(d.messages))
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Failed to load messages"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onSend = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await api("/api/messages", {
        method: "POST",
        json: { recipientType: "ALL_TEACHERS", content: content.trim() }
      });
      setContent("");
      success(t("student.messages.sent"));
      load();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : t("student.messages.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("student.messages.title")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("student.messages.subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={onSend} className="card space-y-3">
            <h2 className="text-sm font-bold text-brand-ink dark:text-brand-paper">{t("student.messages.newMessage")}</h2>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("student.messages.to")}</label>
              <div className="rounded-xl border-2 border-brand-orange/30 bg-brand-orange/5 px-3 py-2.5 text-sm font-semibold text-brand-orange">
                {t("student.messages.allTeachers")}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{t("student.messages.message")}</label>
              <textarea required rows={5} value={content} onChange={(e) => setContent(e.target.value)} className="input-field resize-y" placeholder={t("student.messages.placeholder")} />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full">
              {sending ? <Spinner /> : <><Send className="h-4 w-4" />{t("student.messages.send")}</>}
            </button>
          </form>

          <div className="card">
            <h2 className="mb-3 text-sm font-bold text-brand-ink dark:text-brand-paper">{t("student.messages.conversation")}</h2>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner className="h-6 w-6 text-brand-orange" />
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-red-500">
                <p>{loadError}</p>
                <button onClick={load} className="btn-primary text-xs">{t("student.messages.retry")}</button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-500">
                <MessageSquare className="h-8 w-8 text-gray-300" />
                {t("student.messages.noMessages")}
              </div>
            ) : (
              <ul className="space-y-2 max-h-[500px] overflow-y-auto">
                {messages.map((m) => {
                  const fromMe = m.sender.id === user?.id;
                  return (
                    <li key={m.id} className={`rounded-2xl p-3 ${fromMe ? "ms-12 bg-brand-orange/10" : "me-12 bg-gray-50 dark:bg-white/5"}`}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-ink dark:text-brand-paper">
                          {fromMe ? t("student.messages.you") : m.sender.fullName} <span className="font-normal text-gray-500">({m.sender.role.toLowerCase()})</span>
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
