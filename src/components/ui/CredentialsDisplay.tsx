"use client";
import { useState, memo } from "react";
import { Mail, Eye, EyeOff, Copy, Check } from "lucide-react";
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
      <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
        <div className="mb-1 text-sm font-bold text-brand-ink dark:text-brand-paper">{fullName}</div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-xs font-semibold uppercase text-gray-500">Email</span>
            <div className="mt-0.5 flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-white px-3 py-1.5 font-mono text-sm dark:bg-white/10">{email || "—"}</code>
              {email && (
                <button onClick={() => doCopy(email, "email")} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10">
                  {copied === "email" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-gray-500">Password</span>
            <div className="mt-0.5 flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-white px-3 py-1.5 font-mono text-sm dark:bg-white/10">
                {password ? (showPwd ? password : "•".repeat(password.length)) : "••••••••"}
              </code>
              {password && (
                <>
                  <button onClick={() => setShowPwd((s) => !s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => doCopy(password, "password")} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10">
                    {copied === "password" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </>
              )}
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
