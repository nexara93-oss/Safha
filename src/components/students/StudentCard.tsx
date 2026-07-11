"use client";
import { memo } from "react";
import { Trash2, Eye, GraduationCap } from "lucide-react";

type StudentCardProps = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  serialNumber: string | null;
  onDelete: (id: string, name: string) => void;
  onCredentials: (id: string) => void;
};

export const StudentCard = memo(function StudentCard({ id, fullName, email, phone, serialNumber, onDelete, onCredentials }: StudentCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange/15 text-sm font-bold text-brand-orange">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-brand-ink dark:text-brand-paper">{fullName}</div>
            <div className="truncate text-xs text-gray-500">
              {serialNumber ? `#${serialNumber}` : "—"} {phone ? `• ${phone}` : ""}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onCredentials(id)}
            className="rounded-lg p-2 text-brand-orange transition-colors hover:bg-brand-orange/10"
            aria-label="Credentials"
            title="Show email & password"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(id, fullName)}
            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {email && (
        <div className="mt-2 truncate rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600 dark:bg-white/5 dark:text-white/60">
          {email}
        </div>
      )}
    </div>
  );
});

export const EmptyState = memo(function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 py-12 text-center">
      <Icon className="h-10 w-10 text-gray-300" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
});
