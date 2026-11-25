import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "income" | "expense" | "warning" | "accent";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]",
  income:
    "bg-[var(--color-income-bg)] text-[var(--color-income)] border border-emerald-700/20 dark:border-emerald-400/25",
  expense:
    "bg-[var(--color-expense-bg)] text-[var(--color-expense)] border border-rose-700/20 dark:border-rose-400/25",
  warning:
    "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-amber-700/20 dark:border-amber-400/25",
  accent:
    "bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)] border border-blue-700/20 dark:border-blue-400/25",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold leading-5",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
