"use client";
import { memo } from "react";
import { Trash2, Mail, Copy } from "lucide-react";
import { EyeIcon } from "@/components/ui/EyeIcon";

type TeacherRowProps = {
  id: string;
  fullName: string;
  subject: string;
  email: string | null;
  generatedPassword?: string;
  studentCount: number;
  visiblePasswords: Set<string>;
  copiedField: { id: string; kind: "email" | "password" } | null;
  onDelete: (id: string, name: string) => void;
  onTogglePassword: (id: string) => void;
  onCopyCell: (text: string, id: string, kind: "email" | "password") => void;
};

export const TeacherTableRow = memo(function TeacherTableRow({
  id, fullName, subject, email, generatedPassword, studentCount, visiblePasswords, onDelete, onTogglePassword, onCopyCell
}: TeacherRowProps) {
  return (
    <tr className="border-t border-gray-100 dark:border-white/5">
      <td className="px-4 py-3 font-semibold text-brand-ink dark:text-brand-paper">{fullName}</td>
      <td className="px-4 py-3 text-gray-600 dark:text-white/70">{subject}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <code className="truncate font-mono text-xs text-gray-600 dark:text-white/70">{email}</code>
          {email && (
            <button onClick={() => onCopyCell(email, id, "email")} className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-white" aria-label="Copy email" title="Copy">
              {<Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {generatedPassword ? (
          <div className="flex items-center gap-1.5">
            <code className="rounded-md bg-gray-50 px-2 py-1 font-mono text-xs dark:bg-white/5">
              {visiblePasswords.has(id) ? generatedPassword : "•".repeat(generatedPassword.length)}
            </code>
            <button onClick={() => onTogglePassword(id)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-white" aria-label={visiblePasswords.has(id) ? "Hide password" : "Show password"} title={visiblePasswords.has(id) ? "Hide" : "Show"}>
              <EyeIcon visible={visiblePasswords.has(id)} className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onCopyCell(generatedPassword, id, "password")} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-ink dark:hover:bg-white/10 dark:hover:text-white" aria-label="Copy password">
              {<Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-600 dark:text-white/70">{studentCount}</td>
      <td className="px-4 py-3 text-end">
        <button onClick={() => onDelete(id, fullName)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </td>
    </tr>
  );
});

export const TeacherMobileCard = memo(function TeacherMobileCard({
  id, fullName, subject, email, generatedPassword, visiblePasswords, onDelete, onTogglePassword, onCopyCell
}: TeacherRowProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="truncate font-semibold text-brand-ink dark:text-brand-paper">{fullName}</div>
          <div className="truncate text-xs text-gray-500">{subject}</div>
          <div className="flex items-center gap-2 text-xs">
            <Mail className="h-3 w-3 shrink-0 text-gray-400" />
            <code className="truncate text-gray-600 dark:text-white/70">{email}</code>
            {email && (
              <button onClick={() => onCopyCell(email, id, "email")} className="shrink-0 rounded p-0.5 text-gray-400 hover:text-brand-ink dark:hover:text-white" aria-label="Copy email">
                {<Copy className="h-3 w-3" />}
              </button>
            )}
          </div>
          {generatedPassword && (
            <div className="flex items-center gap-2 text-xs">
              <code className="rounded-md bg-gray-50 px-2 py-0.5 font-mono text-gray-600 dark:bg-white/5 dark:text-white/70">
                {visiblePasswords.has(id) ? generatedPassword : "•".repeat(generatedPassword.length)}
              </code>
              <button onClick={() => onTogglePassword(id)} className="shrink-0 rounded p-0.5 text-gray-400 hover:text-brand-ink dark:hover:text-white" aria-label={visiblePasswords.has(id) ? "Hide password" : "Show password"} title={visiblePasswords.has(id) ? "Hide" : "Show"}>
                <EyeIcon visible={visiblePasswords.has(id)} className="h-3 w-3" />
              </button>
              <button onClick={() => onCopyCell(generatedPassword, id, "password")} className="shrink-0 rounded p-0.5 text-gray-400 hover:text-brand-ink dark:hover:text-white" aria-label="Copy password">
                {<Copy className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>
        <button onClick={() => onDelete(id, fullName)} className="shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});
