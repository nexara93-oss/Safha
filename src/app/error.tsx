"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/ui/Reveal";
import { BrandLogo } from "@/components/ui/BrandLogo";

import { RefreshCw } from "lucide-react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 dark:bg-[#0A0A0A]">
      <Reveal>
        <div className="text-center">
          <BrandLogo className="mx-auto mb-4 h-20 w-20" alt="Safha" />
          <h1 className="font-display text-3xl font-extrabold text-brand-ink dark:text-brand-paper">
            {t("error.title")}
          </h1>
          <p className="mt-2 text-brand-ink/60 dark:text-brand-paper/60">{t("error.subtitle")}</p>
          <button onClick={retry} className="btn-primary mt-6 inline-flex">
            <RefreshCw className="h-4 w-4" />
            {t("common.retry")}
          </button>
        </div>
      </Reveal>
    </div>
  );
}
