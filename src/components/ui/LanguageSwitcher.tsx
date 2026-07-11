"use client";

import { Globe } from "lucide-react";
import { useLanguage, type Locale } from "@/contexts/LanguageContext";
import { useState, useRef, useEffect } from "react";

const labels: Record<Locale, { flag: string; name: string }> = {
  en: { flag: "🇬🇧", name: "English" },
  fr: { flag: "🇫🇷", name: "Français" },
  ar: { flag: "🇲🇦", name: "العربية" }
};

export function LanguageSwitcher({
  className = "",
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t, dir } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("common.language")}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white font-semibold text-brand-ink transition-all hover:border-brand-orange hover:text-brand-orange dark:border-white/10 dark:bg-white/5 dark:text-white ${
          compact ? "h-10 w-10 justify-center" : "h-10 px-3 text-sm"
        }`}
      >
        {compact ? (
          <span aria-hidden className="text-base leading-none">{labels[locale].flag}</span>
        ) : (
          <>
            <Globe className="h-4 w-4" />
            <span aria-hidden>{labels[locale].flag}</span>
            <span className="hidden sm:inline">{labels[locale].name}</span>
          </>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-2 w-44 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-fade-in dark:border-white/10 dark:bg-brand-navy ${
            dir === "rtl"
              ? "left-0 origin-top-left"
              : "right-0 origin-top-right"
          }`}
        >
          {(Object.keys(labels) as Locale[]).map((code) => (
            <button
              key={code}
              role="menuitem"
              onClick={() => {
                setLocale(code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-brand-cream dark:hover:bg-white/5 ${
                locale === code ? "bg-brand-orange/10 text-brand-orange" : "text-brand-ink dark:text-brand-paper"
              }`}
            >
              <span aria-hidden className="text-lg">
                {labels[code].flag}
              </span>
              <span className="font-medium">{labels[code].name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
