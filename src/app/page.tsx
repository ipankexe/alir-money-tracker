"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle2,
  Info,
  Plus,
} from "lucide-react";
import { CashflowTrendChart } from "@/components/dashboard/cashflow-trend-chart";
import { SpendingDonutChart } from "@/components/dashboard/spending-donut-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-views";
import { WalletCard } from "@/components/wallets/wallet-card";
import {
  calculateBudgetStatuses,
  calculateCashflowTrend,
  calculateCategoryBreakdown,
  calculateMonthlySummary,
  calculateTotalNetWorth,
  calculateWalletBalances,
  generateSmartInsights,
} from "@/lib/finance-engine";
import {
  formatIDR,
  formatMonthLabel,
  formatPercent,
  formatShortDate,
  formatSignedPercent,
  shiftMonthKey,
} from "@/lib/format";
import { useFinance } from "@/store/finance-store";
import { cn } from "@/lib/utils";

const BUDGET_STATUS_META = {
  safe: {
    label: "Aman",
    tone: "income" as const,
    barClass: "bg-[#059669]",
  },
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

export default function DashboardPage() {
  const {
    dataset,
    isLoading,
    error,
    selectedMonth,
    retryLoad,
    resetDemoData,
    openQuickAdd,
  } = useFinance();

  const metrics = useMemo(() => {
    if (!dataset) return null;
    const walletBalances = calculateWalletBalances(
      dataset.wallets,
      dataset.transactions
    );
    const activeWallets = walletBalances.filter((wb) => !wb.wallet.isArchived);
    const netWorth = calculateTotalNetWorth(walletBalances);
    const monthlySummary = calculateMonthlySummary(
      dataset.transactions,
      selectedMonth
    );
    const breakdown = calculateCategoryBreakdown(
      dataset.transactions,
      dataset.categories,
      selectedMonth
    );
    const budgetStatuses = calculateBudgetStatuses(
      dataset.budgets,
      dataset.transactions,
      dataset.categories,
      selectedMonth
    );
    const trend = calculateCashflowTrend(dataset.transactions, selectedMonth, 6);
    const insights = generateSmartInsights(
      monthlySummary,
      breakdown,
      budgetStatuses
    );

    const recentTransactions = [...dataset.transactions]
      .sort((a, b) =>
        b.date === a.date
          ? b.createdAt.localeCompare(a.createdAt)
          : b.date.localeCompare(a.date)
      )
      .slice(0, 6);

    return {
      activeWallets,
      netWorth,
      monthlySummary,
      breakdown,
      budgetStatuses,
      trend,
      insights,
      recentTransactions,
      walletMap: new Map(dataset.wallets.map((w) => [w.id, w])),
      categoryMap: new Map(dataset.categories.map((c) => [c.id, c])),
    };
  }, [dataset, selectedMonth]);

  if (isLoading) {
    return <LoadingState label="Menyiapkan ringkasan keuangan..." />;
  }

  if (error || !dataset || !metrics) {
    return (
      <ErrorState
        message={error ?? "Data tidak tersedia."}
        onRetry={retryLoad}
        onResetDemo={resetDemoData}
      />
    );
  }

  const monthLabel = formatMonthLabel(selectedMonth);
  const prevMonthLabel = formatMonthLabel(shiftMonthKey(selectedMonth, -1), true);
  const { monthlySummary, breakdown, budgetStatuses, trend, insights } = metrics;

  return (
    <div className="space-y-6">
      {/* Focal Hero Row: Net Worth + Monthly KPI Strip */}
      <section aria-label="Ringkasan saldo dan arus kas utama">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card elevated className="flex flex-col justify-between lg:col-span-5">
            <CardBody className="flex h-full flex-col justify-between gap-4 pt-5">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Total Kekayaan Bersih
                </p>
                <p className="mt-1.5 text-3xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)] sm:text-4xl">
                  {formatIDR(metrics.netWorth)}
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Arus kas bersih {monthLabel}:{" "}
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      monthlySummary.netCashflow >= 0
                        ? "text-[var(--color-income)]"
                        : "text-[var(--color-expense)]"
                    )}
                  >
                    {monthlySummary.netCashflow >= 0 ? "+" : ""}
                    {formatIDR(monthlySummary.netCashflow)}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <Button
                  size="sm"
                  onClick={() => openQuickAdd({ defaultType: "expense" })}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Catat Pengeluaran</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openQuickAdd({ defaultType: "transfer" })}
                >
                  <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                  <span>Transfer Dompet</span>
                </Button>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-7">
            <Card className="flex flex-col justify-between p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Pemasukan Bulan Ini
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-income-bg)] text-[var(--color-income)]">
                  <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xl font-bold tabular-nums text-[var(--color-income)] sm:text-2xl">
                  {formatIDR(monthlySummary.totalIncome)}
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Periode {monthLabel}
                </p>
              </div>
            </Card>

            <Card className="flex flex-col justify-between p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Pengeluaran Bulan Ini
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-expense-bg)] text-[var(--color-expense)]">
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xl font-bold tabular-nums text-[var(--color-expense)] sm:text-2xl">
                  {formatIDR(monthlySummary.totalExpense)}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {monthlySummary.expenseMoMDelta !== null ? (
                    <Badge
                      tone={
                        monthlySummary.expenseMoMDelta > 0
                          ? "expense"
                          : "income"
                      }
                    >
                      <span className="tabular-nums">
                        {formatSignedPercent(monthlySummary.expenseMoMDelta)} vs{" "}
                        {prevMonthLabel}
                      </span>
                    </Badge>
                  ) : (
                    <span className="text-xs text-[var(--text-secondary)]">
                      Belum ada pembanding {prevMonthLabel}
                    </span>
                  )}
                </div>
              </div>
            </Card>

            <Card className="flex flex-col justify-between p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Saving Rate
                </span>
                <Badge
                  tone={
                    monthlySummary.totalIncome <= 0
                      ? "neutral"
                      : monthlySummary.savingRate >= 20
                        ? "income"
                        : monthlySummary.savingRate > 0
                          ? "warning"
                          : "expense"
                  }
                >
                  {monthlySummary.totalIncome <= 0
                    ? "Belum dihitung"
                    : monthlySummary.savingRate >= 20
                      ? "Sehat"
                      : monthlySummary.savingRate > 0
                        ? "Moderat"
                        : "Defisit"}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-xl font-bold tabular-nums text-[var(--text-primary)] sm:text-2xl">
                  {formatPercent(monthlySummary.savingRate)}
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Porsi pemasukan yang tersisa
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Smart Insight Strip */}
      {insights.length > 0 && (
        <section aria-label="Ringkasan otomatis bulan ini">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3.5">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-5">
              <span className="shrink-0 text-xs font-bold tracking-wide text-[var(--accent-soft-text)]">
                Ringkasan Cepat
              </span>
              <ul className="flex flex-1 flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6 lg:gap-y-1.5">
                {insights.map((insight) => (
                  <li
                    key={insight.id}
                    className="flex items-start gap-2 text-sm text-[var(--text-primary)]"
                  >
                    {insight.tone === "danger" && (
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-expense)]"
                        aria-hidden="true"
                      />
                    )}
                    {insight.tone === "warning" && (
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]"
                        aria-hidden="true"
                      />
                    )}
                    {insight.tone === "positive" && (
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-income)]"
                        aria-hidden="true"
                      />
                    )}
                    {insight.tone === "info" && (
                      <Info
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]"
                        aria-hidden="true"
                      />
                    )}
                    <span>{insight.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Charts Section */}
      <section aria-label="Visualisasi pengeluaran dan tren arus kas">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SpendingDonutChart
              items={breakdown}
              totalExpense={monthlySummary.totalExpense}
              monthLabel={monthLabel}
            />
          </div>
          <div className="lg:col-span-7">
            <CashflowTrendChart data={trend} />
          </div>
        </div>
      </section>

      {/* Vibrant Neo-Banking Wallets Strip */}
      <section aria-label="Daftar dompet aktif">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Dompet Aktif
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Saldo dihitung langsung dari saldo awal, pemasukan, pengeluaran, dan transfer
            </p>
          </div>
          <Link
            href="/wallets"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[var(--accent-soft-text)] hover:bg-[var(--accent-soft-bg)]"
          >
            Kelola Semua Dompet
          </Link>
        </div>

        {metrics.activeWallets.length === 0 ? (
          <EmptyState
            title="Belum ada dompet aktif"
            description="Tambahkan minimal satu rekening bank, e-wallet, atau tunai untuk mulai mencatat saldo."
            actionLabel="Buka Halaman Dompet"
            onAction={() => {
              window.location.href = "/wallets";
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.activeWallets.map((wb) => (
              <WalletCard
                key={wb.wallet.id}
                summary={wb}
                compact
                onTransfer={(walletId) =>
                  openQuickAdd({
                    defaultType: "transfer",
                    defaultWalletId: walletId,
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Bottom Row: Budget Watchlist + Recent Transactions */}
      <section aria-label="Pantauan anggaran dan transaksi terbaru">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardHeader>
              <div>
                <CardTitle>Pantauan Anggaran</CardTitle>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Diurutkan dari pemakaian tertinggi pada {monthLabel}
                </p>
              </div>
              <Link
                href="/budgets"
                className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-xs font-semibold text-[var(--accent-soft-text)] hover:bg-[var(--accent-soft-bg)]"
              >
                Atur Anggaran
              </Link>
            </CardHeader>
            <CardBody>
              {budgetStatuses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--border-strong)] p-6 text-center">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Belum ada batas anggaran di {monthLabel}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Tetapkan batas pengeluaran per kategori agar pengeluaran tetap terkendali.
                  </p>
                  <Link
                    href="/budgets"
                    className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[var(--accent-primary)] px-4 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
                  >
                    Buat Anggaran Pertama
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {budgetStatuses.slice(0, 4).map((item) => {
                    const meta = BUDGET_STATUS_META[item.status];
                    const clampedWidth = Math.min(100, Math.max(0, item.usagePercent));
                    return (
                      <li key={item.budget.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                              style={{ backgroundColor: item.categoryColor }}
                            >
                              <CategoryIcon
                                iconKey={item.categoryIcon}
                                className="h-3.5 w-3.5"
                              />
                            </span>
                            <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {item.categoryName}
                            </span>
                          </div>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </div>

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
                            style={{ width: `${clampedWidth}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs tabular-nums text-[var(--text-secondary)]">
                          <span>
                            {formatIDR(item.spent)} dari{" "}
                            {formatIDR(item.budget.limitAmount)}
                          </span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {formatPercent(item.usagePercent)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card className="lg:col-span-7">
            <CardHeader>
              <div>
                <CardTitle>Transaksi Terbaru</CardTitle>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  6 catatan terakhir dari seluruh dompet
                </p>
              </div>
              <Link
                href="/transactions"
                className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-xs font-semibold text-[var(--accent-soft-text)] hover:bg-[var(--accent-soft-bg)]"
              >
                Lihat Semua
              </Link>
            </CardHeader>
            <CardBody>
              {metrics.recentTransactions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--border-strong)] p-6 text-center">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Belum ada transaksi tercatat
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Tekan tombol Catat Transaksi untuk menambahkan pemasukan, pengeluaran, atau transfer.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => openQuickAdd()}
                  >
                    Catat Transaksi Pertama
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border-default)]">
                  {metrics.recentTransactions.map((tx) => {
                    const category = tx.categoryId
                      ? metrics.categoryMap.get(tx.categoryId)
                      : undefined;
                    const fromWallet = metrics.walletMap.get(tx.walletId);
                    const toWallet = tx.toWalletId
                      ? metrics.walletMap.get(tx.toWalletId)
                      : undefined;

                    const title =
                      tx.note ||
                      (tx.type === "transfer"
                        ? "Transfer Antar Dompet"
                        : (category?.name ?? "Transaksi"));
                    const walletLine =
                      tx.type === "transfer"
                        ? `${fromWallet?.name ?? "-"} ke ${toWallet?.name ?? "-"}`
                        : `${category?.name ?? "Lainnya"} · ${fromWallet?.name ?? "-"}`;

                    return (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
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
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {title}
                            </p>
                            <p className="truncate text-xs text-[var(--text-secondary)]">
                              {walletLine} · {formatShortDate(tx.date)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-bold tabular-nums",
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
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}
