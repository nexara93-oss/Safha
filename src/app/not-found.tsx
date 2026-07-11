"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/ui/Reveal";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 dark:bg-[#0A0A0A]">
      <Reveal>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-blue-700 text-white shadow-lg shadow-brand-orange/30">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="font-display text-5xl font-extrabold text-brand-ink dark:text-brand-paper">404</h1>
          <p className="mt-2 text-brand-ink/60 dark:text-brand-paper/60">Page not found</p>
          <Link href="/" className="btn-primary mt-6 inline-flex">
            <ArrowLeft className="h-4 w-4" />
            {t("common.signin")} ?
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
