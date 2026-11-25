"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Modal } from "@/components/ui/modal";
import {
  formatIDR,
  formatNumberInput,
  getTodayDateString,
  parseIDRInput,
} from "@/lib/format";
import { transactionInputSchema } from "@/lib/validators";
import { useFinance } from "@/store/finance-store";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/types/finance";

const PRESETS = [
  { label: "+10rb", value: 10_000 },
  { label: "+25rb", value: 25_000 },
  { label: "+50rb", value: 50_000 },
  { label: "+100rb", value: 100_000 },
];

const TAB_ITEMS: { key: TransactionType; label: string; activeClass: string }[] = [
  {
    key: "expense",
    label: "Pengeluaran",
    activeClass:
      "bg-[var(--color-expense)] text-white border-transparent",
  },
  {
    key: "income",
    label: "Pemasukan",
    activeClass:
      "bg-[var(--color-income)] text-white border-transparent",
  },
  {
    key: "transfer",
    label: "Transfer",
    activeClass:
      "bg-[var(--accent-primary)] text-white border-transparent",
  },
];

export function QuickAddTransactionModal() {
  const {
    dataset,
    quickAddOpen,
    quickAddOptions,
    closeQuickAdd,
    addTransaction,
    updateTransaction,
  } = useFinance();

  const editing = quickAddOptions.editingTransaction ?? null;
  const activeWallets = useMemo(
    () => (dataset?.wallets ?? []).filter((w) => !w.isArchived),
    [dataset?.wallets]
  );

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<number>(0);
  const [walletId, setWalletId] = useState<string>("");
  const [toWalletId, setToWalletId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amountId = useId();
  const walletFieldId = useId();
  const toWalletFieldId = useId();
  const dateFieldId = useId();
  const noteFieldId = useId();

  const filteredCategories = useMemo(
    () =>
      (dataset?.categories ?? []).filter((cat) =>
        type === "income" ? cat.type === "income" : cat.type === "expense"
      ),
    [dataset?.categories, type]
  );

  useEffect(() => {
    if (!quickAddOpen || !dataset) return;
    setErrors({});

    if (editing) {
      setType(editing.type);
      setAmount(editing.amount);
      setWalletId(editing.walletId);
      setToWalletId(editing.toWalletId ?? "");
      setCategoryId(editing.categoryId ?? "");
      setDate(editing.date);
      setNote(editing.note);
      return;
    }

    const defaultType = quickAddOptions.defaultType ?? "expense";
    const firstWallet = quickAddOptions.defaultWalletId ?? activeWallets[0]?.id ?? "";
    const secondWallet =
      activeWallets.find((w) => w.id !== firstWallet)?.id ?? "";
    const firstCat =
      dataset.categories.find(
        (c) => c.type === (defaultType === "income" ? "income" : "expense")
      )?.id ?? "";

    setType(defaultType);
    setAmount(0);
    setWalletId(firstWallet);
    setToWalletId(secondWallet);
    setCategoryId(firstCat);
    setDate(getTodayDateString());
    setNote("");
  }, [quickAddOpen, editing, quickAddOptions, dataset, activeWallets]);

  function handleTabChange(nextType: TransactionType) {
    setType(nextType);
    setErrors({});
    if (nextType === "transfer") {
      if (!toWalletId || toWalletId === walletId) {
        const alt = activeWallets.find((w) => w.id !== walletId)?.id ?? "";
        setToWalletId(alt);
      }
    } else if (dataset) {
      const currentValid = dataset.categories.some(
        (c) => c.id === categoryId && c.type === nextType
      );
      if (!currentValid) {
        const firstMatch = dataset.categories.find((c) => c.type === nextType);
        setCategoryId(firstMatch?.id ?? "");
      }
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const parsed = transactionInputSchema.safeParse({
      type,
      amount,
      walletId,
      toWalletId: type === "transfer" ? toWalletId : undefined,
      categoryId: type === "transfer" ? undefined : categoryId,
      note,
      date,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    if (editing) {
      updateTransaction(editing.id, parsed.data);
    } else {
      addTransaction(parsed.data);
    }
    closeQuickAdd();
  }

  return (
    <Modal
      open={quickAddOpen}
      onClose={closeQuickAdd}
      title={editing ? "Ubah Transaksi" : "Catat Transaksi Cepat"}
      description={
        type === "transfer"
          ? "Memindahkan saldo antar dompet tanpa mengubah total kekayaan bersih."
          : "Saldo dompet dan grafik analitik langsung diperbarui otomatis."
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div
          role="tablist"
          aria-label="Jenis transaksi"
          className="grid grid-cols-3 gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-1"
        >
          {TAB_ITEMS.map((item) => {
            const isSelected = type === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleTabChange(item.key)}
                className={cn(
                  "min-h-11 rounded-md border px-3 text-sm font-semibold transition-colors",
                  isSelected
                    ? item.activeClass
                    : "border-transparent bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div>
          <label
            htmlFor={amountId}
            className="block text-sm font-medium text-[var(--text-secondary)]"
          >
            Nominal (Rupiah)
          </label>
          <div className="relative mt-1.5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-bold text-[var(--text-muted)]"
            >
              Rp
            </span>
            <input
              id={amountId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={formatNumberInput(amount)}
              onChange={(e) => {
                setAmount(parseIDRInput(e.target.value));
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
              }}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? `${amountId}-error` : undefined}
              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] py-3 pr-4 pl-12 text-2xl font-bold tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          {errors.amount && (
            <p
              id={`${amountId}-error`}
              role="alert"
              className="mt-1.5 text-xs font-medium text-[var(--color-expense)]"
            >
              {errors.amount}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setAmount((prev) => prev + preset.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
                }}
                className="min-h-11 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3 text-xs font-semibold tabular-nums text-[var(--text-primary)] hover:border-[var(--border-strong)]"
              >
                {preset.label}
              </button>
            ))}
            {amount > 0 && (
              <button
                type="button"
                onClick={() => setAmount(0)}
                className="min-h-11 rounded-lg border border-transparent px-3 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {type === "transfer" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <div>
              <label
                htmlFor={walletFieldId}
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                Dari Dompet
              </label>
              <select
                id={walletFieldId}
                value={walletId}
                onChange={(e) => {
                  setWalletId(e.target.value);
                  setErrors((prev) => ({ ...prev, walletId: "", toWalletId: "" }));
                }}
                aria-invalid={Boolean(errors.walletId)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)]"
              >
                <option value="">Pilih dompet asal</option>
                {activeWallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {errors.walletId && (
                <p role="alert" className="mt-1 text-xs font-medium text-[var(--color-expense)]">
                  {errors.walletId}
                </p>
              )}
            </div>

            <div className="hidden h-11 items-center justify-center text-[var(--text-muted)] sm:flex">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </div>

            <div>
              <label
                htmlFor={toWalletFieldId}
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                Ke Dompet
              </label>
              <select
                id={toWalletFieldId}
                value={toWalletId}
                onChange={(e) => {
                  setToWalletId(e.target.value);
                  setErrors((prev) => ({ ...prev, toWalletId: "" }));
                }}
                aria-invalid={Boolean(errors.toWalletId)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)]"
              >
                <option value="">Pilih dompet tujuan</option>
                {activeWallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {errors.toWalletId && (
                <p role="alert" className="mt-1 text-xs font-medium text-[var(--color-expense)]">
                  {errors.toWalletId}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div>
              <label
                htmlFor={walletFieldId}
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                {type === "income" ? "Dompet Tujuan" : "Dompet Sumber"}
              </label>
              <select
                id={walletFieldId}
                value={walletId}
                onChange={(e) => {
                  setWalletId(e.target.value);
                  setErrors((prev) => ({ ...prev, walletId: "" }));
                }}
                aria-invalid={Boolean(errors.walletId)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)]"
              >
                <option value="">Pilih dompet</option>
                {activeWallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {errors.walletId && (
                <p role="alert" className="mt-1 text-xs font-medium text-[var(--color-expense)]">
                  {errors.walletId}
                </p>
              )}
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-[var(--text-secondary)]">
                Kategori
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredCategories.map((cat) => {
                  const selected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setCategoryId(cat.id);
                        setErrors((prev) => ({ ...prev, categoryId: "" }));
                      }}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors",
                        selected
                          ? "border-[var(--accent-primary)] bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]"
                          : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
                      )}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon iconKey={cat.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
              {errors.categoryId && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-[var(--color-expense)]">
                  {errors.categoryId}
                </p>
              )}
            </fieldset>
          </>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={dateFieldId}
              className="block text-sm font-medium text-[var(--text-secondary)]"
            >
              Tanggal
            </label>
            <input
              id={dateFieldId}
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrors((prev) => ({ ...prev, date: "" }));
              }}
              aria-invalid={Boolean(errors.date)}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-medium tabular-nums text-[var(--text-primary)]"
            />
            {errors.date && (
              <p role="alert" className="mt-1 text-xs font-medium text-[var(--color-expense)]">
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={noteFieldId}
              className="block text-sm font-medium text-[var(--text-secondary)]"
            >
              Catatan singkat
            </label>
            <input
              id={noteFieldId}
              type="text"
              maxLength={120}
              placeholder="Contoh: Makan siang kantor"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={closeQuickAdd}>
            Batal
          </Button>
          <Button type="submit">
            {editing
              ? "Simpan Perubahan"
              : amount > 0
                ? `Simpan ${formatIDR(amount)}`
                : "Simpan Transaksi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
