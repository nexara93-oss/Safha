"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { TrialBanner } from "./TrialBanner";
import { useLanguage } from "@/contexts/LanguageContext";

type AllowedRole = "DIRECTOR" | "TEACHER" | "STUDENT" | "ADMIN";

const DashboardContext = createContext<{ sidebarOpen: boolean; setSidebarOpen: (b: boolean) => void } | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardShell");
  return ctx;
}

export function DashboardShell({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { dir } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allowedRolesKey = useMemo(() => allowedRoles.join(","), [allowedRoles]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    } else if (!loading && user && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [user, loading, router, allowedRolesKey]);

  if (loading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream dark:bg-[#0A0A0A]">
        <Spinner className="h-8 w-8 text-brand-orange" />
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div dir={dir} className="min-h-screen bg-brand-cream dark:bg-[#0A0A0A]">
        <TrialBanner />
        <div className="flex">
          <Sidebar role={user.role as AllowedRole} />
          <div className="flex min-h-screen flex-1 flex-col lg:ms-72">
            <Topbar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
