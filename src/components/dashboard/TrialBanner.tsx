"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";
import { Sparkles, X } from "lucide-react";
import Link from "next/link";

type Sub = { plan: string; endDate: string } | null;

export function TrialBanner() {
  const { user } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!user || fetched) return;
    if (user.role !== "DIRECTOR" || !user.schoolId) return;
    setFetched(true);
    api<{ subscription: Sub }>("/api/subscription")
      .then((data) => {
        if (data.subscription?.plan === "FREE_TRIAL") {
          const ms = new Date(data.subscription.endDate).getTime() - Date.now();
          setDaysLeft(Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000))));
        } else {
          setDaysLeft(null);
        }
      })
      .catch(() => setDaysLeft(null));
  }, [user, fetched]);

  if (user?.role !== "DIRECTOR" || daysLeft === null || dismissed) return null;

  const urgent = daysLeft <= 3;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold sm:px-6 ${
        urgent ? "bg-red-500 text-white" : "bg-gradient-to-r from-brand-orange to-blue-700 text-white"
      }`}
      role="status"
    >
      <div className="flex items-center gap-2 truncate">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span className="truncate">
          {daysLeft === 0
            ? "Your free trial has ended. Upgrade to keep using EduWave."
            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/director/payment"
          className="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur transition-colors hover:bg-white/30"
        >
          Upgrade
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-white/80 hover:bg-white/20 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
