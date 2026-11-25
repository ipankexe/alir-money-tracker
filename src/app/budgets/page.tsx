"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-views";
import { calculateBudgetStatuses, getBudgetHealth } from "@/lib/finance-engine";
import {
  formatIDR,
  formatMonthLabel,
  formatNumberInput,
  formatPercent,
  parseIDRInput,
} from "@/lib/format";
import { budgetInputSchema } from "@/lib/validators";
import { useFinance } from "@/store/finance-store";
import { cn } from "@/lib/utils";

const STATUS_META = {
  safe: { label: "Aman", tone: "income" as const, barClass: "bg-[#059669]" },
  warning: {
    label: "Hati-hati",
    tone: "warning" as const,
    barClass: "bg-[#D97706]",
  },
  exceeded: {
    label: "Melebihi Batas",
    tone: "expense" as const,
    barClass: "bg-[#E11D48]",
  },
};

export default function BudgetsPage() {
  const {
    dataset,
    isLoading,
    error,
    selectedMonth,
    retryLoad,
    resetDemoData,
    upsertBudget,
    deleteBudget,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingCategoryLocked, setEditingCategoryLocked] = useState(false);

  const catFieldId = useId();
  const limitFieldId = useId();

  const expenseCategories = useMemo(
    () => (dataset?.categories ?? []).filter((c) => c.type === "expense"),
    [dataset?.categories]
  );

  const budgetStatuses = useMemo(() => {
    if (!dataset) return [];
    return calculateBudgetStatuses(
      dataset.budgets,
      dataset.transactions,
      dataset.categories,
      selectedMonth
    );
  }, [dataset, selectedMonth]);

  const totals = useMemo(() => {
    const totalLimit = budgetStatuses.reduce(
      (sum, item) => sum + item.budget.limitAmount,
      0
    );
    const totalSpent = budgetStatuses.reduce((sum, item) => sum + item.spent, 0);
    const remaining = totalLimit - totalSpent;
    const usagePercent =
      totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 1000) / 10 : 0;
    return {
      totalLimit,
      totalSpent,
      remaining,
      usagePercent,
      health: getBudgetHealth(usagePercent),
    };
  }, [budgetStatuses]);

  if (isLoading) {
    return <LoadingState label="Memuat anggaran bulanan..." />;
  }

  if (error || !dataset) {
    return (
      <ErrorState
        message={error ?? "Data anggaran tidak tersedia."}
        onRetry={retryLoad}
        onResetDemo={resetDemoData}
      />
    );
  }

  const monthLabel = formatMonthLabel(selectedMonth);

  function openNewBudgetModal() {
    const budgetedIds = new Set(budgetStatuses.map((b) => b.budget.categoryId));
    const firstAvailable =
      expenseCategories.find((c) => !budgetedIds.has(c.id)) ??
      expenseCategories[0];
    setCategoryId(firstAvailable?.id ?? "");
    setLimitAmount(500_000);
    setEditingCategoryLocked(false);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditBudgetModal(catId: string, currentLimit: number) {
    setCategoryId(catId);
    setLimitAmount(currentLimit);
    setEditingCategoryLocked(true);
    setFormError(null);
    setModalOpen(true);
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    const parsed = budgetInputSchema.safeParse({
      categoryId,
      month: selectedMonth,
      limitAmount,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Periksa kembali input anggaran.");
      return;
    }

    upsertBudget(parsed.data);
    setModalOpen(false);
  }

  const overallMeta = STATUS_META[totals.health];

  return (
    <div className="space-y-6">
      {/* Overall Budget Summary */}
      <Card elevated>
        <CardBody className="space-y-4 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">
                Total Anggaran {monthLabel}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                <p className="text-2xl font-extrabold tabular-nums text-[var(--text-primary)] sm:text-3xl">
                  {formatIDR(totals.totalSpent)}
                </p>
                <span className="text-sm font-medium tabular-nums text-[var(--text-secondary)]">
                  dari {formatIDR(totals.totalLimit)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {budgetStatuses.length > 0 && (
                <Badge tone={overallMeta.tone}>
                  {overallMeta.label} ({formatPercent(totals.usagePercent)})
                </Badge>
              )}
              <Button size="sm" onClick={openNewBudgetModal}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Atur Anggaran</span>
              </Button>
            </div>
          </div>

          {budgetStatuses.length > 0 && (
            <>
              <div
                className="h-3 w-full overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]"
                role="progressbar"
                aria-valuenow={Math.round(totals.usagePercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Total pemakaian anggaran bulanan"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-150",
                    overallMeta.barClass
                  )}
                  style={{ width: `${Math.min(100, totals.usagePercent)}%` }}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5">
                  <p className="text-xs text-[var(--text-secondary)]">Total Batas</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-[var(--text-primary)]">
                    {formatIDR(totals.totalLimit)}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5">
                  <p className="text-xs text-[var(--text-secondary)]">Terpakai</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-[var(--text-primary)]">
                    {formatIDR(totals.totalSpent)}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5">
                  <p className="text-xs text-[var(--text-secondary)]">
                    {totals.remaining >= 0 ? "Sisa Anggaran" : "Melebihi Batas"}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-sm font-bold tabular-nums",
                      totals.remaining >= 0
                        ? "text-[var(--color-income)]"
                        : "text-[var(--color-expense)]"
                    )}
                  >
                    {formatIDR(Math.abs(totals.remaining))}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Per-Category Budget Cards */}
      {budgetStatuses.length === 0 ? (
        <EmptyState
          title={`Belum ada anggaran di ${monthLabel}`}
          description="Tetapkan batas bulanan per kategori pengeluaran agar Alir dapat memberi peringatan sebelum pengeluaran melewati target."
          actionLabel="Tambah Anggaran Pertama"
          onAction={openNewBudgetModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {budgetStatuses.map((item) => {
            const meta = STATUS_META[item.status];
            const barWidth = Math.min(100, Math.max(0, item.usagePercent));
            return (
              <Card key={item.budget.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: item.categoryColor }}
                    >
                      <CategoryIcon
                        iconKey={item.categoryIcon}
                        className="h-5 w-5"
                      />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-[var(--text-primary)]">
                        {item.categoryName}
                      </h2>
                      <p className="text-xs tabular-nums text-[var(--text-secondary)]">
                        Batas {formatIDR(item.budget.limitAmount)}
                      </p>
                    </div>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]"
                    role="progressbar"
                    aria-valuenow={Math.round(item.usagePercent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Pemakaian anggaran ${item.categoryName}`}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-150",
                        meta.barClass
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                    <span className="font-semibold text-[var(--text-primary)]">
                      Terpakai {formatIDR(item.spent)} ({formatPercent(item.usagePercent)})
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        item.remaining >= 0
                          ? "text-[var(--text-secondary)]"
                          : "text-[var(--color-expense)]"
                      )}
                    >
                      {item.remaining >= 0
                        ? `Sisa ${formatIDR(item.remaining)}`
                        : `Lebih ${formatIDR(Math.abs(item.remaining))}`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-[var(--border-default)] pt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      openEditBudgetModal(
                        item.budget.categoryId,
                        item.budget.limitAmount
                      )
                    }
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Ubah Batas</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteBudget(item.budget.id)}
                    className="text-[var(--color-expense)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Hapus</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upsert Budget Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategoryLocked ? "Ubah Batas Anggaran" : "Tambah Anggaran Bulanan"}
        description={`Berlaku untuk periode ${monthLabel}.`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor={catFieldId}
              className="block text-sm font-medium text-[var(--text-secondary)]"
            >
              Kategori Pengeluaran
            </label>
            <select
              id={catFieldId}
              value={categoryId}
              disabled={editingCategoryLocked}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)] disabled:opacity-60"
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={limitFieldId}
              className="block text-sm font-medium text-[var(--text-secondary)]"
            >
              Batas Pengeluaran Bulanan (Rupiah)
            </label>
            <div className="relative mt-1.5">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]"
              >
                Rp
              </span>
              <input
                id={limitFieldId}
                type="text"
                inputMode="numeric"
                value={formatNumberInput(limitAmount)}
                onChange={(e) => {
                  setLimitAmount(parseIDRInput(e.target.value));
                  setFormError(null);
                }}
                className="min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] py-2.5 pr-4 pl-10 text-base font-bold tabular-nums text-[var(--text-primary)]"
              />
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-[var(--color-expense)]">
              {formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Anggaran</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
