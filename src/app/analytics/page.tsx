"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-views";
import {
  calculateCashflowTrend,
  calculateCategoryBreakdown,
  calculateDailySpending,
  calculateMonthlySummary,
  calculateWeekdayVsWeekend,
} from "@/lib/finance-engine";
import {
  formatIDR,
  formatMonthLabel,
  formatPercent,
  formatSignedPercent,
  shiftMonthKey,
} from "@/lib/format";
import { useFinance } from "@/store/finance-store";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const {
    dataset,
    isLoading,
    error,
    selectedMonth,
    retryLoad,
    resetDemoData,
    openQuickAdd,
  } = useFinance();

  const analytics = useMemo(() => {
    if (!dataset) return null;
    const summary = calculateMonthlySummary(dataset.transactions, selectedMonth);
    const trend = calculateCashflowTrend(dataset.transactions, selectedMonth, 6);
    const breakdown = calculateCategoryBreakdown(
      dataset.transactions,
      dataset.categories,
      selectedMonth
    );
    const daily = calculateDailySpending(dataset.transactions, selectedMonth);
    const weekdayWeekend = calculateWeekdayVsWeekend(
      dataset.transactions,
      selectedMonth
    );
    const highestDay = daily.reduce(
      (max, item) => (item.amount > max.amount ? item : max),
      { day: 0, date: "", amount: 0 }
    );
    const sixMonthNet = trend.reduce((sum, item) => sum + item.net, 0);

    return {
      summary,
      trend,
      breakdown,
      daily,
      weekdayWeekend,
      highestDay,
      sixMonthNet,
    };
  }, [dataset, selectedMonth]);

  if (isLoading) {
    return <LoadingState label="Menghitung analitik arus kas..." />;
  }

  if (error || !dataset || !analytics) {
    return (
      <ErrorState
        message={error ?? "Data analitik tidak tersedia."}
        onRetry={retryLoad}
        onResetDemo={resetDemoData}
      />
    );
  }

  const monthLabel = formatMonthLabel(selectedMonth);
  const prevMonthLabel = formatMonthLabel(shiftMonthKey(selectedMonth, -1), true);
  const hasAnyTx = dataset.transactions.length > 0;

  if (!hasAnyTx) {
    return (
      <EmptyState
        title="Belum ada data untuk dianalisis"
        description="Catat pemasukan atau pengeluaran terlebih dahulu agar grafik tren 6 bulan, pengeluaran harian, dan perbandingan kategori terisi otomatis."
        actionLabel="Catat Transaksi Pertama"
        onAction={() => openQuickAdd()}
      />
    );
  }

  const { weekdayWeekend, breakdown, trend, daily, highestDay, sixMonthNet } =
    analytics;

  return (
    <div className="space-y-6">
      {/* 6-Month Grouped Bar + Net Line */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Bagaimana arus kas 6 bulan terakhir?</CardTitle>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Perbandingan Pemasukan, Pengeluaran, dan garis Arus Kas Bersih hingga {monthLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-secondary)]">
              Akumulasi arus kas bersih 6 bulan
            </p>
            <p
              className={cn(
                "text-base font-bold tabular-nums",
                sixMonthNet >= 0
                  ? "text-[var(--color-income)]"
                  : "text-[var(--color-expense)]"
              )}
            >
              {sixMonthNet >= 0 ? "+" : ""}
              {formatIDR(sixMonthNet)}
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-[#059669]" />
              Pemasukan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-[#E11D48]" />
              Pengeluaran
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-0.5 w-4 bg-[#2563EB]" />
              Net Cashflow
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={trend}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border-default)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val: number) => formatIDR(val, true)}
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={76}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      income: "Pemasukan",
                      expense: "Pengeluaran",
                      net: "Net Cashflow",
                    };
                    return [formatIDR(value), labels[name] ?? name];
                  }}
                  contentStyle={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-strong)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="income" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
                <Bar dataKey="expense" fill="#E11D48" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#2563EB" }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* Daily Spending + Weekday vs Weekend */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <div>
              <CardTitle>Hari mana pengeluaran paling tinggi di {monthLabel}?</CardTitle>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {highestDay.amount > 0
                  ? `Puncak pengeluaran pada tanggal ${highestDay.day} sebesar ${formatIDR(highestDay.amount)}.`
                  : `Belum ada pengeluaran harian pada ${monthLabel}.`}
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={daily}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border-default)"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(val: number) => formatIDR(val, true)}
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip
                    labelFormatter={(day) => `Tanggal ${day} ${monthLabel}`}
                    formatter={(val: number) => [formatIDR(val), "Pengeluaran"]}
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-strong)",
                      borderRadius: "10px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#1D4ED8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={18}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="flex flex-col justify-between lg:col-span-4">
          <CardHeader>
            <div>
              <CardTitle>Pola Hari Kerja vs Akhir Pekan</CardTitle>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Rata-rata pengeluaran per hari kalender di {monthLabel}
              </p>
            </div>
          </CardHeader>
          <CardBody className="flex flex-1 flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-3.5">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                  Hari Kerja (Senin sampai Jumat)
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">
                  {formatIDR(weekdayWeekend.weekdayDailyAverage)}
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {" "}
                    / hari
                  </span>
                </p>
                <p className="mt-1 text-xs tabular-nums text-[var(--text-secondary)]">
                  Total: {formatIDR(weekdayWeekend.weekdayTotal)}
                </p>
              </div>

              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-3.5">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                  Akhir Pekan (Sabtu dan Minggu)
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">
                  {formatIDR(weekdayWeekend.weekendDailyAverage)}
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {" "}
                    / hari
                  </span>
                </p>
                <p className="mt-1 text-xs tabular-nums text-[var(--text-secondary)]">
                  Total: {formatIDR(weekdayWeekend.weekendTotal)}
                </p>
              </div>
            </div>

            <p className="rounded-lg border border-[var(--border-default)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              {weekdayWeekend.higherPeriod === "weekend"
                ? "Rata-rata pengeluaran harian di akhir pekan lebih tinggi dibanding hari kerja."
                : weekdayWeekend.higherPeriod === "weekday"
                  ? "Rata-rata pengeluaran harian lebih banyak terjadi di hari kerja."
                  : "Rata-rata pengeluaran harian di hari kerja dan akhir pekan seimbang."}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Full Category Breakdown Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Rincian Pengeluaran per Kategori ({monthLabel})</CardTitle>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Porsi terhadap total pengeluaran dan perbandingan terhadap {prevMonthLabel}
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {breakdown.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border-strong)] py-8 text-center text-sm text-[var(--text-secondary)]">
              Belum ada pengeluaran kategori di {monthLabel}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)]">
                    <th className="py-3 pr-4">Kategori</th>
                    <th className="px-4 py-3 text-right">Transaksi</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                    <th className="px-4 py-3 text-right">Porsi</th>
                    <th className="px-4 py-3 text-right">vs {prevMonthLabel}</th>
                    <th className="hidden py-3 pl-4 sm:table-cell sm:w-44">Distribusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {breakdown.map((item) => (
                    <tr key={item.categoryId}>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: item.color }}
                          >
                            <CategoryIcon iconKey={item.icon} className="h-4 w-4" />
                          </span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.categoryName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-[var(--text-secondary)]">
                        {item.transactionCount}x
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums text-[var(--text-primary)]">
                        {formatIDR(item.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-[var(--text-secondary)]">
                        {formatPercent(item.sharePercent)}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {item.momDelta !== null ? (
                          <Badge tone={item.momDelta > 0 ? "expense" : "income"}>
                            <span className="tabular-nums">
                              {formatSignedPercent(item.momDelta)}
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">Baru</span>
                        )}
                      </td>
                      <td className="hidden py-3.5 pl-4 sm:table-cell">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, item.sharePercent)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
