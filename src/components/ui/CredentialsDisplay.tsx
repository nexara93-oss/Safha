"use client";
import { useState, memo } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { Spinner } from "@/components/ui/Spinner";

type CredentialsDisplayProps = {
  fullName: string;
  email: string;
  password: string;
  onReset?: () => void;
  resetting?: boolean;
};

export const CredentialsDisplay = memo(function CredentialsDisplay({ fullName, email, password, onReset, resetting }: CredentialsDisplayProps) {
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState<"email" | "password" | null>(null);

  const doCopy = async (text: string, kind: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-white/5 dark:bg-white/[0.03]">
        <div className="mb-3 text-end text-sm font-bold text-brand-ink dark:text-white">{fullName}</div>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</span>
              {email && (
                <button onClick={() => doCopy(email, "email")} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 transition-colors hover:bg-white hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-white">
                  {copied === "email" ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </button>
              )}
            </div>
            <code className="block w-full truncate rounded-xl bg-white px-4 py-2.5 text-end font-mono text-sm text-brand-ink dark:bg-white/10 dark:text-white">{email || "—"}</code>
          </div>
          <div>
            <div className="mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Password</span>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-white px-2 py-1.5 dark:bg-white/10">
              {password && (
                <>
                  <button
                    onClick={() => setShowPwd((s) => !s)}
                    className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    title={showPwd ? "Hide" : "Show"}
                  >
                    <EyeIcon visible={showPwd} className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => doCopy(password, "password")}
                    className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Copy password"
                    title="Copy"
                  >
                    {copied === "password" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </>
              )}
              <code className="flex-1 truncate px-2 text-end font-mono text-sm tracking-wider text-brand-ink dark:text-white" dir="ltr">
                {password ? (showPwd ? password : "•".repeat(password.length)) : "••••••••"}
              </code>
            </div>
          </div>
        </div>
      </div>
      {onReset && (
        <button onClick={onReset} disabled={resetting} className="btn-primary w-full">
          {resetting ? <Spinner /> : "Reset password"}
        </button>
      )}
    </div>
  );
});
