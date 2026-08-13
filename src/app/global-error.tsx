"use client";

import "./globals.css";

import { BrandLogo } from "@/components/ui/BrandLogo";

import { RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-brand-cream px-4 dark:bg-[#0A0A0A]">
        <div className="text-center">
          <BrandLogo className="mx-auto mb-4 h-20 w-20" alt="Safha" />
          <h1 className="font-display text-3xl font-extrabold text-brand-ink dark:text-brand-paper">
            Something went wrong
          </h1>
          <p className="mt-2 text-brand-ink/60 dark:text-brand-paper/60">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={retry}
            className="btn-primary mt-6 inline-flex"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
