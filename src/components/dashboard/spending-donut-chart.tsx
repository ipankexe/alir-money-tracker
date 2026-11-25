"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatIDR, formatPercent } from "@/lib/format";
import type { CategoryBreakdownItem } from "@/types/finance";

interface SpendingDonutChartProps {
  items: CategoryBreakdownItem[];
  totalExpense: number;
  monthLabel: string;
}

export function SpendingDonutChart({
  items,
  totalExpense,
  monthLabel,
}: SpendingDonutChartProps) {
  const topFive = items.slice(0, 5);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Uang lari ke mana bulan ini?</CardTitle>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Distribusi pengeluaran {monthLabel} berdasarkan kategori
          </p>
        </div>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col justify-between gap-4">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-strong)] px-4 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Belum ada pengeluaran di {monthLabel}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Catat pengeluaran pertama untuk melihat proporsi tiap kategori di sini.
            </p>
          </div>
        ) : (
          <>
            <div className="relative h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={items}
                    dataKey="amount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={92}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {items.map((entry) => (
                      <Cell key={entry.categoryId} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatIDR(value), "Pengeluaran"]}
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-strong)",
                      borderRadius: "10px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                    itemStyle={{ color: "var(--text-primary)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Total keluar
                </span>
                <span className="mt-0.5 text-base font-extrabold tabular-nums text-[var(--text-primary)] sm:text-lg">
                  {formatIDR(totalExpense, true)}
                </span>
              </div>
            </div>

            <ul className="space-y-2.5" aria-label="5 kategori pengeluaran terbesar">
              {topFive.map((item) => (
                <li
                  key={item.categoryId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      <CategoryIcon iconKey={item.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate font-medium text-[var(--text-primary)]">
                      {item.categoryName}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5 tabular-nums">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatIDR(item.amount)}
                    </span>
                    <span className="w-12 text-right text-xs font-semibold text-[var(--text-secondary)]">
                      {formatPercent(item.sharePercent)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardBody>
    </Card>
  );
}
