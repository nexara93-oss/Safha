"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { FileText, Eye, EyeOff, Copy, Check } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";

type CreatedStudent = { id: string; fullName: string; email: string; defaultPassword: string };

type PdfImportModalProps = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

export default function PdfImportModal({ open, onClose, onImported }: PdfImportModalProps) {
  const { success, error } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [parsed, setParsed] = useState<{ firstName: string; lastName: string; serialNumber?: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ students: CreatedStudent[]; count: number } | null>(null);
  const [showPwd, setShowPwd] = useState<{ [k: string]: boolean }>({});
  const [copied, setCopied] = useState<string | null>(null);

  const handlePdf = async () => {
    if (!pdfFile) return;
    setPdfParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", pdfFile);
      const res = await fetch("/api/import/students-pdf", {
        method: "POST", body: fd, credentials: "same-origin"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setParsed(data.students);
      success(`Found ${data.count} students in PDF`);
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setPdfParsing(false);
    }
  };

  const importParsed = async () => {
    if (parsed.length === 0) return;
    setImporting(true);
    try {
      const res = await api<{ students: CreatedStudent[]; count: number }>("/api/import/students-bulk", {
        method: "POST", json: { students: parsed }
      });
      setImportResult(res);
      success(`Imported ${res.count} students`);
      setParsed([]);
      setPdfFile(null);
      onImported();
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => { setParsed([]); setImportResult(null); setPdfFile(null); }, 300);
  };

  return (
    <Modal open={open} onClose={close} title="Bulk import from PDF" size="lg">
      {importResult ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            Successfully imported {importResult.count} students. Share their default passwords:
          </div>
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {importResult.students.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                <span className="flex-1 font-semibold">{s.fullName}</span>
                <code className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-white/10">
                  {showPwd[s.id] ? s.defaultPassword : "•".repeat(s.defaultPassword.length)}
                </code>
                <button onClick={() => setShowPwd((m) => ({ ...m, [s.id]: !m[s.id] }))} className="rounded-md p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10" aria-label="Show">
                  {showPwd[s.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(s.defaultPassword); setCopied(s.id); setTimeout(() => setCopied(null), 1500); }} className="rounded-md p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10" aria-label="Copy">
                  {copied === s.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-1">
            <button onClick={close} className="btn-primary">Done</button>
          </div>
        </div>
      ) : parsed.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-brand-ink/80 dark:text-brand-paper/80">
            Found <strong>{parsed.length}</strong> students. Review and confirm:
          </p>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-gray-100 p-2 dark:border-white/5">
            {parsed.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm dark:bg-white/5">
                <span>{p.serialNumber ? <span className="text-gray-400">#{p.serialNumber} </span> : null}{p.firstName} {p.lastName}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setParsed([])} className="btn-ghost">Re-upload</button>
            <button onClick={importParsed} disabled={importing} className="btn-primary">
              {importing ? <Spinner /> : `Import ${parsed.length} students`}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-white/10 dark:bg-white/5">
            <FileText className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Upload a PDF with student names. We'll auto-extract them.</p>
            <p className="mt-1 text-xs text-gray-400">Tip: PDFs work best with text like &quot;1. Youssef Amrani&quot; or one name per line.</p>
          </div>
          <input type="file" accept="application/pdf,text/plain" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
          {pdfFile && <p className="text-xs text-gray-500">Selected: {pdfFile.name}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={close} className="btn-ghost">Cancel</button>
            <button onClick={handlePdf} disabled={!pdfFile || pdfParsing} className="btn-primary">
              {pdfParsing ? <Spinner /> : "Parse PDF"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
