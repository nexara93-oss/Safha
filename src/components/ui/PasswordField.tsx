"use client";
import { useState, memo } from "react";
import { Copy, Check } from "lucide-react";
import { EyeIcon } from "@/components/ui/EyeIcon";

type PasswordFieldProps = {
  password: string;
  id: string;
  show?: boolean;
  onToggle?: (id: string) => void;
  visibleSet?: Set<string>;
};

export const PasswordField = memo(function PasswordField({ password, id, visibleSet }: PasswordFieldProps) {
  const [localVisible, setLocalVisible] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const visible = visibleSet ? visibleSet.has(id) : localVisible;

  const toggle = () => {
    if (visibleSet) {
      setLocalVisible(!visible);
    } else {
      setLocalVisible((v) => !v);
    }
  };

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  return (
    <div className="flex items-center gap-1.5">
      <code className="rounded-md bg-gray-50 px-2 py-1 font-mono text-xs dark:bg-white/5">
        {visible ? password : "•".repeat(password.length)}
      </code>
      <button onClick={toggle} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-white" aria-label={visible ? "Hide" : "Show"} title={visible ? "Hide" : "Show"}>
        <EyeIcon visible={visible} className="h-3.5 w-3.5" />
      </button>
      <button onClick={doCopy} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-white" aria-label="Copy" title="Copy">
        {copiedId === id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
});

type EmailFieldProps = {
  email: string;
  id: string;
};

export const EmailField = memo(function EmailField({ email, id }: EmailFieldProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  if (!email) return <span className="text-xs text-gray-400">—</span>;

  return (
    <div className="flex items-center gap-1.5">
      <code className="truncate font-mono text-xs text-gray-600 dark:text-white/70">{email}</code>
      <button onClick={doCopy} className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-white" aria-label="Copy email" title="Copy">
        {copiedId === id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
});
