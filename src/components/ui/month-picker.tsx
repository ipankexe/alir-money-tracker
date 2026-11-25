"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel, shiftMonthKey } from "@/lib/format";

interface MonthPickerProps {
  monthKey: string;
  onChange: (nextMonth: string) => void;
}

export function MonthPicker({ monthKey, onChange }: MonthPickerProps) {
  return (
    <div
      className="inline-flex items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]"
      role="group"
      aria-label="Pemilih periode bulan"
    >
      <button
        type="button"
        onClick={() => onChange(shiftMonthKey(monthKey, -1))}
        aria-label="Bulan sebelumnya"
        className="inline-flex h-11 w-11 items-center justify-center rounded-l-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)]"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="min-w-[132px] px-2 text-center text-sm font-semibold tabular-nums text-[var(--text-primary)] sm:min-w-[148px]">
        {formatMonthLabel(monthKey)}
      </span>
      <button
        type="button"
        onClick={() => onChange(shiftMonthKey(monthKey, 1))}
        aria-label="Bulan berikutnya"
        className="inline-flex h-11 w-11 items-center justify-center rounded-r-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)]"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
