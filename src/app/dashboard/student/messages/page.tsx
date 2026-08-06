"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import ChatApp from "@/components/dashboard/ChatApp";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StudentMessagesPage() {
  const { t } = useLanguage();

  return (
    <DashboardShell allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink sm:text-3xl dark:text-white">
            {t("student.messages.title")}
          </h1>
          <p className="text-sm text-brand-ink/60 dark:text-brand-paper/60">{t("student.messages.subtitle")}</p>
        </div>
        <ChatApp />
      </div>
    </DashboardShell>
  );
}
