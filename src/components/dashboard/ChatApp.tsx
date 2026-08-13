"use client";

import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Plus, Search, MessageSquare, Check, CheckCheck, ChevronLeft } from "lucide-react";

type Contact = { id: string; fullName: string; role: string };

type Msg = {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  recipientType: string;
  recipientId: string | null;
  sender: Contact;
  recipient: Contact | null;
};

type Conversation = { partner: Contact; messages: Msg[]; unread: number };

const AVATAR_COLORS = [
  "bg-brand-orange",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-fuchsia-500"
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?"
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string, yesterdayLabel: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return formatTime(iso);
  if (sameDay(d, new Date(today.getTime() - 86400000))) return yesterdayLabel;
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function ChatApp() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<Contact | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const d = await api<{ messages: Msg[]; contacts: Contact[] }>("/api/messages");
        if (cancelled) return;
        setMessages(d.messages);
        setContacts(d.contacts);
        setLoadError(null);
      } catch (e: unknown) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : t("chat.loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    tick();
    const int = setInterval(tick, 8000);
    return () => {
      cancelled = true;
      clearInterval(int);
    };
  }, []);

  const conversations = useMemo(() => {
    const map = new Map<string, Conversation>();
    for (const m of messages) {
      const fromMe = m.sender.id === user?.id;
      const partnerId = fromMe ? m.recipientId : m.sender.id;
      if (!partnerId) continue;
      const partnerName = fromMe ? (m.recipient?.fullName ?? "?") : m.sender.fullName;
      const partnerRole = fromMe ? (m.recipient?.role ?? "") : m.sender.role;
      let conv = map.get(partnerId);
      if (!conv) {
        conv = { partner: { id: partnerId, fullName: partnerName, role: partnerRole }, messages: [], unread: 0 };
        map.set(partnerId, conv);
      }
      conv.messages.push(m);
      if (!fromMe && !m.read && user?.id === m.recipientId) conv.unread++;
    }
    for (const conv of map.values()) {
      conv.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return [...map.values()].sort((a, b) => {
      const ta = a.messages[a.messages.length - 1]?.createdAt ?? "";
      const tb = b.messages[b.messages.length - 1]?.createdAt ?? "";
      return tb.localeCompare(ta);
    });
  }, [messages, user?.id]);

  const activeMessages = useMemo(() => {
    if (!activePartner) return [];
    return conversations.find((c) => c.partner.id === activePartner.id)?.messages ?? [];
  }, [conversations, activePartner]);

  useEffect(() => {
    if (!activePartner || !user) return;
    const unreadIds = messages
      .filter((m) => m.recipientId === user.id && m.sender.id === activePartner.id && !m.read)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    Promise.all(unreadIds.map((id) => api(`/api/messages/${id}/read`, { method: "POST" })))
      .then(() =>
        setMessages((ms) => ms.map((m) => (unreadIds.includes(m.id) ? { ...m, read: true } : m)))
      )
      .catch(() => {});
  }, [activePartner, messages, user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activePartner?.id, activeMessages.length]);

  const openChat = (partner: Contact) => {
    setActivePartner(partner);
    setNewChatOpen(false);
    setMobileView(true);
    setSearch("");
  };

  const goBack = () => {
    setMobileView(false);
    setActivePartner(null);
  };

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!activePartner || !content.trim()) return;
    setSending(true);
    try {
      const d = await api<{ message: Msg }>("/api/messages", {
        method: "POST",
        json: { recipientId: activePartner.id, content: content.trim() }
      });
      setMessages((ms) => [d.message, ...ms]);
      setContent("");
      success(t("chat.sent"));
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : t("chat.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.fullName.toLowerCase().includes(search.trim().toLowerCase())
  );
  const existingPartnerIds = new Set(conversations.map((c) => c.partner.id));

  const partnerAvatar = activePartner ? (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(activePartner.fullName)}`}>
      {initials(activePartner.fullName)}
    </div>
  ) : null;

  return (
    <div className="card flex h-[calc(100dvh-240px)] min-h-[480px] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex w-full flex-col border-b border-gray-100 dark:border-white/10 sm:flex sm:w-72 sm:border-b-0 sm:border-s md:w-80 ${
          mobileView ? "hidden" : "flex"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <h2 className="text-sm font-bold text-brand-ink dark:text-brand-paper">{t("msg.inbox")}</h2>
          <button
            type="button"
            onClick={() => {
              setNewChatOpen((v) => !v);
              setSearch("");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-white transition hover:bg-brand-orange/90"
            title={t("chat.newChat")}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {newChatOpen && (
          <div className="mx-3 mb-3 rounded-xl border border-brand-orange/30 bg-brand-orange/5 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-orange">
              {t("chat.newChat")}
            </p>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("chat.searchPlaceholder")}
                className="input-field ps-9"
              />
            </div>
            <ul className="max-h-52 space-y-1 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <li className="py-4 text-center text-xs text-gray-500">{t("chat.noResults")}</li>
              ) : (
                filteredContacts.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => openChat(c)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm text-brand-ink transition hover:bg-brand-orange/10 dark:text-brand-paper"
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(c.fullName)}`}>
                        {initials(c.fullName)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{c.fullName}</span>
                        <span className="block text-[10px] uppercase tracking-wider text-gray-400">{c.role.toLowerCase()}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner className="h-6 w-6 text-brand-orange" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-red-500">
              <p>{loadError}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-gray-500">
              <MessageSquare className="h-8 w-8 text-gray-300" />
              {t("chat.noConversations")}
            </div>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => {
                const last = c.messages[c.messages.length - 1];
                const fromMe = last.sender.id === user?.id;
                const isActive = activePartner?.id === c.partner.id;
                return (
                  <li key={c.partner.id}>
                    <button
                      type="button"
                      onClick={() => openChat(c.partner)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${
                        isActive ? "bg-brand-orange/10" : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(c.partner.fullName)}`}>
                        {initials(c.partner.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-sm font-bold ${isActive ? "text-brand-orange" : "text-brand-ink dark:text-brand-paper"}`}>
                            {c.partner.fullName}
                          </span>
                          <span className="shrink-0 text-[10px] text-gray-400">{formatDay(last.createdAt, t("chat.yesterday"))}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1 truncate text-xs text-gray-500">
                            {fromMe && (last.read ? <CheckCheck className="h-3.5 w-3.5 shrink-0 text-sky-500" /> : <Check className="h-3.5 w-3.5 shrink-0 text-gray-400" />)}
                            <span className="truncate">{fromMe ? `${t("chat.you")}: ` : ""}{last.content}</span>
                          </span>
                          {c.unread > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange px-1.5 text-[10px] font-bold text-white">
                              {c.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Main chat */}
      <section className={`flex flex-1 flex-col ${mobileView ? "flex" : "hidden sm:flex"}`}>
        {activePartner ? (
          <>
            <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/10">
              <button
                type="button"
                onClick={goBack}
                className="flex h-8 w-8 items-center justify-center rounded-full text-brand-ink transition hover:bg-gray-100 dark:text-brand-paper dark:hover:bg-white/10 sm:hidden"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {partnerAvatar}
              <div className="min-w-0">
                <h3 className="truncate font-bold text-brand-ink dark:text-brand-paper">{activePartner.fullName}</h3>
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t("chat.online")} • <span className="uppercase tracking-wider">{activePartner.role.toLowerCase()}</span>
                </p>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-gray-50/50 px-4 py-4 dark:bg-white/[0.03]">
              {activeMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
                  <MessageSquare className="h-8 w-8 text-gray-300" />
                  {t("chat.startConversation")}
                </div>
              ) : (
                activeMessages.map((m) => {
                  const fromMe = m.sender.id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${
                          fromMe
                            ? "rounded-ee-md bg-brand-orange text-white"
                            : "rounded-es-md bg-white text-brand-ink dark:bg-white/10 dark:text-brand-paper"
                        }`}
                      >
                        {!fromMe && (
                          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                            {m.sender.fullName}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${fromMe ? "text-white/70" : "text-gray-400"}`}>
                          <span>{formatTime(m.createdAt)}</span>
                          {fromMe &&
                            (m.read ? (
                              <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-white/70" />
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={onSend} className="flex items-end gap-2 border-t border-gray-100 px-3 py-3 dark:border-white/10">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend(e);
                  }
                }}
                rows={1}
                placeholder={t("chat.typeMessage")}
                className="input-field max-h-32 min-h-[44px] flex-1 resize-none"
              />
              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white transition hover:bg-brand-orange/90 disabled:opacity-40"
              >
                {sending ? <Spinner className="h-4 w-4" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-gray-500">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange/10">
              <MessageSquare className="h-8 w-8 text-brand-orange" />
            </div>
            <p className="text-sm font-semibold text-brand-ink dark:text-brand-paper">{t("chat.selectChat")}</p>
            {!existingPartnerIds.size && !loading && (
              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                className="btn-primary text-xs"
              >
                <Plus className="h-4 w-4" /> {t("chat.newChat")}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
