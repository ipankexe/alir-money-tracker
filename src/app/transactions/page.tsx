"use client";

import { useId, useMemo, useState } from "react";
import { Download, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-views";
import { downloadTransactionsCsv } from "@/lib/csv-export";
import { formatIDR, formatMonthLabel, formatShortDate } from "@/lib/format";
import { useFinance } from "@/store/finance-store";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/types/finance";

const TYPE_BADGE_MAP: Record<
  TransactionType,
  { label: string; tone: "income" | "expense" | "accent" }
> = {
  income: { label: "Pemasukan", tone: "income" },
  expense: { label: "Pengeluaran", tone: "expense" },
  transfer: { label: "Transfer", tone: "accent" },
};

export default function TransactionsPage() {
  const {
    dataset,
    isLoading,
    error,
    selectedMonth,
    retryLoad,
    resetDemoData,
    openQuickAdd,
    deleteTransaction,
    showToast,
  } = useFinance();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [walletFilter, setWalletFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scope, setScope] = useState<"month" | "all">("month");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const searchId = useId();
  const typeId = useId();
  const walletId = useId();
  const categoryId = useId();
  const scopeId = useId();

  const walletMap = useMemo(
    () => new Map((dataset?.wallets ?? []).map((w) => [w.id, w])),
    [dataset?.wallets]
  );
  const categoryMap = useMemo(
    () => new Map((dataset?.categories ?? []).map((c) => [c.id, c])),
    [dataset?.categories]
  );

  const filteredTransactions = useMemo(() => {
    if (!dataset) return [];
    const query = search.trim().toLowerCase();

    return dataset.transactions
      .filter((tx) => {
        if (scope === "month" && !tx.date.startsWith(selectedMonth)) {
          return false;
        }
        if (typeFilter !== "all" && tx.type !== typeFilter) {
          return false;
        }
        if (
          walletFilter !== "all" &&
          tx.walletId !== walletFilter &&
          tx.toWalletId !== walletFilter
        ) {
          return false;
        }
        if (categoryFilter !== "all" && tx.categoryId !== categoryFilter) {
          return false;
        }
        if (query) {
          const catName = tx.categoryId
            ? (categoryMap.get(tx.categoryId)?.name.toLowerCase() ?? "")
            : "transfer antar dompet";
          const wName = walletMap.get(tx.walletId)?.name.toLowerCase() ?? "";
          const toWName = tx.toWalletId
            ? (walletMap.get(tx.toWalletId)?.name.toLowerCase() ?? "")
            : "";
          const matches =
            tx.note.toLowerCase().includes(query) ||
            catName.includes(query) ||
            wName.includes(query) ||
            toWName.includes(query);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) =>
        b.date === a.date
          ? b.createdAt.localeCompare(a.createdAt)
          : b.date.localeCompare(a.date)
      );
  }, [
    dataset,
    search,
    typeFilter,
    walletFilter,
    categoryFilter,
    scope,
    selectedMonth,
    categoryMap,
    walletMap,
  ]);

  const totals = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === "income") totalIn += tx.amount;
      if (tx.type === "expense") totalOut += tx.amount;
    }
    return {
      count: filteredTransactions.length,
      totalIn,
      totalOut,
      net: totalIn - totalOut,
    };
  }, [filteredTransactions]);

  if (isLoading) {
    return <LoadingState label="Memuat daftar transaksi..." />;
  }

  if (error || !dataset) {
    return (
      <ErrorState
        message={error ?? "Data tidak tersedia."}
        onRetry={retryLoad}
        onResetDemo={resetDemoData}
      />
    );
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    walletFilter !== "all" ||
    categoryFilter !== "all";

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setWalletFilter("all");
    setCategoryFilter("all");
    setScope("month");
  }

  function handleExportCsv() {
    if (!dataset || filteredTransactions.length === 0) return;
    const suffix = scope === "month" ? selectedMonth : "semua-periode";
    downloadTransactionsCsv(
      filteredTransactions,
      dataset.wallets,
      dataset.categories,
      `alir-transaksi-${suffix}.csv`
    );
    showToast(`Berhasil mengekspor ${filteredTransactions.length} transaksi ke CSV.`);
  }

  return (
    <div className="space-y-5">
      {/* Filter Controls */}
      <Card>
        <CardBody className="space-y-4 pt-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <label
                htmlFor={searchId}
                className="block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Cari catatan, kategori, atau dompet
              </label>
              <div className="relative mt-1.5">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <input
                  id={searchId}
                  type="search"
                  placeholder="Ketik kata kunci..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] pr-3 pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor={typeId}
                className="block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Jenis
              </label>
              <select
                id={typeId}
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as "all" | TransactionType)
                }
                className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="all">Semua jenis</option>
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor={walletId}
                className="block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Dompet
              </label>
              <select
                id={walletId}
                value={walletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="all">Semua dompet</option>
                {dataset.wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor={categoryId}
                className="block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Kategori
              </label>
              <select
                id={categoryId}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="all">Semua kategori</option>
                {dataset.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor={scopeId}
                className="block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Periode
              </label>
              <select
                id={scopeId}
                value={scope}
                onChange={(e) => setScope(e.target.value as "month" | "all")}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="month">{formatMonthLabel(selectedMonth)}</option>
                <option value="all">Semua bulan</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)] pt-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm">
              <span className="font-semibold text-[var(--text-secondary)]">
                {totals.count} transaksi
              </span>
              <span className="tabular-nums text-[var(--color-income)]">
                Masuk: <strong>{formatIDR(totals.totalIn)}</strong>
              </span>
              <span className="tabular-nums text-[var(--color-expense)]">
                Keluar: <strong>{formatIDR(totals.totalOut)}</strong>
              </span>
              <span className="tabular-nums text-[var(--text-primary)]">
                Selisih:{" "}
                <strong>
                  {totals.net >= 0 ? "+" : ""}
                  {formatIDR(totals.net)}
                </strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Reset Filter</span>
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCsv}
                disabled={filteredTransactions.length === 0}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Export CSV</span>
              </Button>
              <Button size="sm" onClick={() => openQuickAdd()}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Catat Baru</span>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results */}
      {dataset.transactions.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi tersimpan"
          description="Kamu sedang menggunakan ruang kerja kosong. Catat pemasukan, pengeluaran, atau transfer pertama untuk memulai."
          actionLabel="Catat Transaksi Pertama"
          onAction={() => openQuickAdd()}
        />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi yang cocok"
          description={
            scope === "month"
              ? `Tidak ditemukan transaksi pada ${formatMonthLabel(selectedMonth)} dengan kriteria filter saat ini.`
              : "Tidak ditemukan transaksi yang cocok dengan filter saat ini."
          }
          actionLabel="Reset Filter"
          onAction={resetFilters}
          secondaryAction={
            scope === "month" ? (
              <Button variant="secondary" onClick={() => setScope("all")}>
                Tampilkan Semua Bulan
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--text-secondary)]">
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Catatan & Kategori</th>
                    <th className="px-4 py-3">Dompet</th>
                    <th className="px-4 py-3">Jenis</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {filteredTransactions.map((tx) => {
                    const category = tx.categoryId
                      ? categoryMap.get(tx.categoryId)
                      : undefined;
                    const fromWallet = walletMap.get(tx.walletId);
                    const toWallet = tx.toWalletId
                      ? walletMap.get(tx.toWalletId)
                      : undefined;
                    const typeMeta = TYPE_BADGE_MAP[tx.type];

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-[var(--bg-surface-subtle)]/60"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap tabular-nums text-[var(--text-secondary)]">
                          {formatShortDate(tx.date)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                              style={{
                                backgroundColor:
                                  tx.type === "transfer"
                                    ? "#1D4ED8"
                                    : (category?.color ?? "#475569"),
                              }}
                            >
                              <CategoryIcon
                                iconKey={
                                  tx.type === "transfer"
                                    ? "ArrowLeftRight"
                                    : (category?.icon ?? "CircleDot")
                                }
                                className="h-4 w-4"
                              />
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--text-primary)]">
                                {tx.note ||
                                  (tx.type === "transfer"
                                    ? "Transfer Antar Dompet"
                                    : (category?.name ?? "Transaksi"))}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {tx.type === "transfer"
                                  ? "Pemindahan saldo"
                                  : (category?.name ?? "Lainnya")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[var(--text-secondary)]">
                          {tx.type === "transfer"
                            ? `${fromWallet?.name ?? "-"} ke ${toWallet?.name ?? "-"}`
                            : (fromWallet?.name ?? "-")}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3.5 text-right font-bold whitespace-nowrap tabular-nums",
                            tx.type === "income" && "text-[var(--color-income)]",
                            tx.type === "expense" && "text-[var(--color-expense)]",
                            tx.type === "transfer" && "text-[var(--color-transfer)]"
                          )}
                        >
                          {tx.type === "income"
                            ? "+"
                            : tx.type === "expense"
                              ? "-"
                              : ""}
                          {formatIDR(tx.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {confirmDeleteId === tx.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  deleteTransaction(tx.id);
                                  setConfirmDeleteId(null);
                                }}
                              >
                                Hapus
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Batal
                              </Button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openQuickAdd({ editingTransaction: tx })
                                }
                                aria-label={`Ubah transaksi ${tx.note || tx.date}`}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)]"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(tx.id)}
                                aria-label={`Hapus transaksi ${tx.note || tx.date}`}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--color-expense-bg)] hover:text-[var(--color-expense)]"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Stacked Cards */}
          <div className="space-y-3 md:hidden">
            {filteredTransactions.map((tx) => {
              const category = tx.categoryId
                ? categoryMap.get(tx.categoryId)
                : undefined;
              const fromWallet = walletMap.get(tx.walletId);
              const toWallet = tx.toWalletId
                ? walletMap.get(tx.toWalletId)
                : undefined;
              const typeMeta = TYPE_BADGE_MAP[tx.type];

              return (
                <Card key={tx.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{
                          backgroundColor:
                            tx.type === "transfer"
                              ? "#1D4ED8"
                              : (category?.color ?? "#475569"),
                        }}
                      >
                        <CategoryIcon
                          iconKey={
                            tx.type === "transfer"
                              ? "ArrowLeftRight"
                              : (category?.icon ?? "CircleDot")
                          }
                          className="h-4 w-4"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                          {tx.note ||
                            (tx.type === "transfer"
                              ? "Transfer Antar Dompet"
                              : (category?.name ?? "Transaksi"))}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                          {tx.type === "transfer"
                            ? `${fromWallet?.name ?? "-"} ke ${toWallet?.name ?? "-"}`
                            : `${category?.name ?? "Lainnya"} · ${fromWallet?.name ?? "-"}`}
                        </p>
                        <p className="mt-1 text-xs tabular-nums text-[var(--text-muted)]">
                          {formatShortDate(tx.date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          tx.type === "income" && "text-[var(--color-income)]",
                          tx.type === "expense" && "text-[var(--color-expense)]",
                          tx.type === "transfer" && "text-[var(--color-transfer)]"
                        )}
                      >
                        {tx.type === "income"
                          ? "+"
                          : tx.type === "expense"
                            ? "-"
                            : ""}
                        {formatIDR(tx.amount)}
                      </p>
                      <div className="mt-1">
                        <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-[var(--border-default)] pt-3">
                    {confirmDeleteId === tx.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Batal
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            deleteTransaction(tx.id);
                            setConfirmDeleteId(null);
                          }}
                        >
                          Konfirmasi Hapus
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openQuickAdd({ editingTransaction: tx })}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Ubah</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmDeleteId(tx.id)}
                          className="text-[var(--color-expense)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Hapus</span>
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
