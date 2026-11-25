"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export function LoadingState({ label = "Memuat data keuangan..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="space-y-4 py-4"
    >
      <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-32 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 md:col-span-2">
          <div className="h-4 w-36 rounded bg-[var(--bg-surface-subtle)]" />
          <div className="mt-4 h-9 w-56 rounded bg-[var(--bg-surface-subtle)]" />
        </div>
        <div className="h-32 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
          <div className="h-4 w-28 rounded bg-[var(--bg-surface-subtle)]" />
          <div className="mt-4 h-9 w-36 rounded bg-[var(--bg-surface-subtle)]" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]" />
        <div className="h-64 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]" />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]">
          <Inbox className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="mt-1 max-w-md text-sm text-[var(--text-secondary)]">
          {description}
        </p>
        {(actionLabel || secondaryAction) && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {actionLabel && onAction && (
              <Button onClick={onAction}>{actionLabel}</Button>
            )}
            {secondaryAction}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onResetDemo?: () => void;
}

export function ErrorState({ message, onRetry, onResetDemo }: ErrorStateProps) {
  return (
    <Card>
      <CardBody className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-expense-bg)] text-[var(--color-expense)]">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Data keuangan tidak dapat dimuat
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]" role="alert">
              {message}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRetry}>
            Coba Muat Ulang
          </Button>
          {onResetDemo && (
            <Button onClick={onResetDemo}>Pulihkan Data Demo</Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
