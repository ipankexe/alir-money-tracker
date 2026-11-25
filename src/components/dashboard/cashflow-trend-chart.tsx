"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/format";
import type { CashflowTrendPoint } from "@/types/finance";

interface CashflowTrendChartProps {
  data: CashflowTrendPoint[];
}

export function CashflowTrendChart({ data }: CashflowTrendChartProps) {
  const hasAnyData = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Pemasukan vs Pengeluaran, 6 bulan terakhir</CardTitle>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Transfer antar dompet tidak dihitung sebagai pemasukan atau pengeluaran
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-sm bg-[#059669]"
            />
            Pemasukan
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-sm bg-[#E11D48]"
            />
            Pengeluaran
          </span>
        </div>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col justify-center">
        {!hasAnyData ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-strong)] px-4 text-center">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Belum ada histori arus kas 6 bulan terakhir
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Mulai catat pemasukan dan pengeluaran untuk melihat tren bulanan.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="alirIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="alirExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E11D48" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#E11D48" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
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
                  formatter={(value: number, name: string) => [
                    formatIDR(value),
                    name === "income" ? "Pemasukan" : "Pengeluaran",
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-strong)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#059669"
                  strokeWidth={2.25}
                  fill="url(#alirIncomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#E11D48"
                  strokeWidth={2.25}
                  fill="url(#alirExpenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
