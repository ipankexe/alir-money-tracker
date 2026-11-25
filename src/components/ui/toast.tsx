"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useFinance } from "@/store/finance-store";
import { cn } from "@/lib/utils";

export function ToastRegion() {
  const { toast, dismissToast } = useFinance();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed right-4 bottom-24 z-50 flex max-w-sm flex-col gap-2 lg:bottom-6"
    >
      {toast && (
        <div
          role={toast.tone === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
            toast.tone === "success" &&
              "border-emerald-700/25 bg-[var(--bg-surface)] text-[var(--text-primary)]",
            toast.tone === "info" &&
              "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]",
            toast.tone === "error" &&
              "border-rose-700/35 bg-[var(--color-expense-bg)] text-[var(--color-expense)]"
          )}
        >
          {toast.tone === "success" && (
            <CheckCircle2
              className="h-5 w-5 shrink-0 text-[var(--color-income)]"
              aria-hidden="true"
            />
          )}
          {toast.tone === "info" && (
            <Info
              className="h-5 w-5 shrink-0 text-[var(--color-transfer)]"
              aria-hidden="true"
            />
          )}
          {toast.tone === "error" && (
            <AlertCircle
              className="h-5 w-5 shrink-0 text-[var(--color-expense)]"
              aria-hidden="true"
            />
          )}
          <span className="flex-1">{toast.text}</span>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Tutup notifikasi"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
