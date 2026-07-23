"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Info, AlertTriangle, CheckCircle2, XCircle, Bell, CheckCheck } from "lucide-react";

type Notification = {
  id: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function DirectorNotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api<{ notifications: Notification[] }>("/api/notifications")
      .then((d) => setNotifications(d.notifications))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : t("director.notifications.loadFailed")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

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

  const colorMap: Record<string, string> = {
    INFO: "text-blue-500",
    WARNING: "text-amber-500",
    SUCCESS: "text-emerald-500",
    ERROR: "text-red-500",
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardShell allowedRoles={["DIRECTOR"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
              {t("dashboard.notifications")}
            </h1>
            <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">
              {unreadCount > 0 ? t("director.notifications.unreadCount", { count: unreadCount }) : t("notifications.allCaughtUp")}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-primary text-sm">
              <CheckCheck className="h-4 w-4" /> {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-orange" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={load} className="btn-primary text-sm">{t("director.notifications.retry")}</button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">{t("notifications.noNotifications")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = iconMap[n.type] || Info;
              return (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`card flex w-full items-start gap-4 text-start transition-opacity ${n.read ? "opacity-60" : ""}`}
                >
                  <div className={`mt-0.5 shrink-0 ${n.read ? "text-gray-400" : colorMap[n.type] || "text-brand-orange"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${n.read ? "font-medium text-brand-ink/70 dark:text-brand-paper/70" : "font-bold text-brand-ink dark:text-brand-paper"}`}>
                        {n.title}
                      </span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-orange" />}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="shrink-0 self-center text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
