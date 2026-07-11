"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ArrowRight, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

type Notification = {
  id: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const fetchNotifications = () => {
    api<{ notifications: Notification[] }>("/api/notifications?limit=5")
      .then((d) => setNotifications(d.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await api("/api/notifications", { method: "PATCH", json: { id } });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api("/api/notifications", { method: "PATCH", json: { markAll: true } });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    INFO: Info,
    WARNING: AlertTriangle,
    SUCCESS: CheckCircle2,
    ERROR: XCircle,
  };

  const rolePath = user?.role?.toLowerCase() ?? "student";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-brand-ink hover:border-brand-orange hover:text-brand-orange dark:border-white/10 dark:bg-white/5 dark:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-md">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-brand-navy">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/5">
            <h3 className="text-sm font-bold text-brand-ink dark:text-brand-paper">{t("dashboard.notifications")}</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-brand-orange hover:text-brand-orange/80">
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">{t("common.empty")}</div>
            ) : (
              notifications.map((n) => {
                const Icon = iconMap[n.type] || Info;
                return (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-start transition-colors hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5 ${n.read ? "opacity-60" : ""}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${n.read ? "text-gray-400" : "text-brand-orange"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm ${n.read ? "font-medium text-brand-ink/70 dark:text-brand-paper/70" : "font-bold text-brand-ink dark:text-brand-paper"}`}>
                        {n.title}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-orange" />}
                  </button>
                );
              })
            )}
          </div>

          <Link
            href={`/dashboard/${rolePath}/notifications`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 border-t border-gray-100 px-4 py-3 text-sm font-semibold text-brand-orange transition-colors hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
