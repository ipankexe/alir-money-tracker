import {
  formatIDR,
  formatMonthLabel,
  formatPercent,
  getDaysInMonth,
  shiftMonthKey,
} from "@/lib/format";
import type {
  Budget,
  BudgetHealth,
  BudgetStatusItem,
  CashflowTrendPoint,
  Category,
  CategoryBreakdownItem,
  DailySpendingPoint,
  MonthlySummary,
  SmartInsight,
  Transaction,
  Wallet,
  WalletBalanceSummary,
  WeekdayWeekendSummary,
} from "@/types/finance";

export function calculateWalletBalances(
  wallets: Wallet[],
  transactions: Transaction[]
): WalletBalanceSummary[] {
  const accumulator = new Map<
    string,
    { inflow: number; outflow: number; count: number }
  >();

  for (const wallet of wallets) {
    accumulator.set(wallet.id, { inflow: 0, outflow: 0, count: 0 });
  }

  for (const tx of transactions) {
    const amount = Math.round(tx.amount);
    if (tx.type === "income") {
      const target = accumulator.get(tx.walletId);
      if (target) {
        target.inflow += amount;
        target.count += 1;
      }
    } else if (tx.type === "expense") {
      const source = accumulator.get(tx.walletId);
      if (source) {
        source.outflow += amount;
        source.count += 1;
      }
    } else if (tx.type === "transfer") {
      const source = accumulator.get(tx.walletId);
      if (source) {
        source.outflow += amount;
        source.count += 1;
      }
      if (tx.toWalletId) {
        const destination = accumulator.get(tx.toWalletId);
        if (destination) {
          destination.inflow += amount;
          destination.count += 1;
        }
      }
    }
  }

  return wallets.map((wallet) => {
    const stats = accumulator.get(wallet.id) ?? {
      inflow: 0,
      outflow: 0,
      count: 0,
    };
    const initial = Math.round(wallet.initialBalance);
    return {
      wallet,
      balance: initial + stats.inflow - stats.outflow,
      totalInflow: stats.inflow,
      totalOutflow: stats.outflow,
      transactionCount: stats.count,
    };
  });
}

export function calculateTotalNetWorth(
  walletBalances: WalletBalanceSummary[],
  includeArchived = false
): number {
  return walletBalances.reduce((total, item) => {
    if (!includeArchived && item.wallet.isArchived) return total;
    return total + item.balance;
  }, 0);
}

export function calculateMoMDelta(
  currentValue: number,
  previousValue: number
): number | null {
  if (previousValue <= 0) return null;
  const raw = ((currentValue - previousValue) / previousValue) * 100;
  return Math.round(raw * 10) / 10;
}

export function calculateSavingRate(
  totalIncome: number,
  totalExpense: number
): number {
  if (totalIncome <= 0) return 0;
  const raw = ((totalIncome - totalExpense) / totalIncome) * 100;
  return Math.round(raw * 10) / 10;
}

export function calculateMonthlySummary(
  transactions: Transaction[],
  monthKey: string
): MonthlySummary {
  const prevMonthKey = shiftMonthKey(monthKey, -1);
  let totalIncome = 0;
  let totalExpense = 0;
  let previousMonthExpense = 0;
  let transactionCount = 0;

  for (const tx of transactions) {
    const amount = Math.round(tx.amount);
    if (tx.date.startsWith(monthKey)) {
      transactionCount += 1;
      if (tx.type === "income") {
        totalIncome += amount;
      } else if (tx.type === "expense") {
        totalExpense += amount;
      }
    } else if (tx.date.startsWith(prevMonthKey) && tx.type === "expense") {
      previousMonthExpense += amount;
    }
  }

  const netCashflow = totalIncome - totalExpense;
  const savingRate = calculateSavingRate(totalIncome, totalExpense);
  const expenseMoMDelta = calculateMoMDelta(totalExpense, previousMonthExpense);

  return {
    monthKey,
    totalIncome,
    totalExpense,
    netCashflow,
    savingRate,
    previousMonthExpense,
    expenseMoMDelta,
    transactionCount,
  };
}

export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): CategoryBreakdownItem[] {
  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));
  const currentTotals = new Map<string, { amount: number; count: number }>();
  const prevTotals = new Map<string, number>();

  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.categoryId) continue;
    const amount = Math.round(tx.amount);

    if (tx.date.startsWith(monthKey)) {
      totalExpense += amount;
      const existing = currentTotals.get(tx.categoryId) ?? {
        amount: 0,
        count: 0,
      };
      existing.amount += amount;
      existing.count += 1;
      currentTotals.set(tx.categoryId, existing);
    } else if (tx.date.startsWith(prevMonthKey)) {
      prevTotals.set(tx.categoryId, (prevTotals.get(tx.categoryId) ?? 0) + amount);
    }
  }

  const items: CategoryBreakdownItem[] = [];

  for (const [categoryId, stats] of currentTotals.entries()) {
    const category = categoryMap.get(categoryId);
    const previousAmount = prevTotals.get(categoryId) ?? 0;
    const sharePercent =
      totalExpense > 0
        ? Math.round((stats.amount / totalExpense) * 1000) / 10
        : 0;

    items.push({
      categoryId,
      categoryName: category?.name ?? "Lainnya",
      color: category?.color ?? "#64748B",
      icon: category?.icon ?? "CircleDot",
      amount: stats.amount,
      sharePercent,
      previousAmount,
      momDelta: calculateMoMDelta(stats.amount, previousAmount),
      transactionCount: stats.count,
    });
  }

  return items.sort((a, b) => b.amount - a.amount);
}

export function getBudgetHealth(usagePercent: number): BudgetHealth {
  if (usagePercent >= 100) return "exceeded";
  if (usagePercent >= 80) return "warning";
  return "safe";
}

export function calculateBudgetStatuses(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): BudgetStatusItem[] {
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));
  const spentByCategory = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.categoryId) continue;
    if (!tx.date.startsWith(monthKey)) continue;
    spentByCategory.set(
      tx.categoryId,
      (spentByCategory.get(tx.categoryId) ?? 0) + Math.round(tx.amount)
    );
  }

  return budgets
    .filter((budget) => budget.month === monthKey)
    .map((budget) => {
      const category = categoryMap.get(budget.categoryId);
      const limit = Math.round(budget.limitAmount);
      const spent = spentByCategory.get(budget.categoryId) ?? 0;
      const remaining = limit - spent;
      const usagePercent =
        limit > 0 ? Math.round((spent / limit) * 1000) / 10 : 0;

      return {
        budget,
        categoryName: category?.name ?? "Kategori",
        categoryColor: category?.color ?? "#64748B",
        categoryIcon: category?.icon ?? "CircleDot",
        spent,
        remaining,
        usagePercent,
        status: getBudgetHealth(usagePercent),
      };
    })
    .sort((a, b) => b.usagePercent - a.usagePercent);
}

export function calculateCashflowTrend(
  transactions: Transaction[],
  endMonthKey: string,
  monthsCount = 6
): CashflowTrendPoint[] {
  const points: CashflowTrendPoint[] = [];

  for (let offset = -(monthsCount - 1); offset <= 0; offset += 1) {
    const monthKey = shiftMonthKey(endMonthKey, offset);
    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      if (!tx.date.startsWith(monthKey)) continue;
      const amount = Math.round(tx.amount);
      if (tx.type === "income") income += amount;
      if (tx.type === "expense") expense += amount;
    }

    points.push({
      monthKey,
      label: formatMonthLabel(monthKey, true),
      income,
      expense,
      net: income - expense,
    });
  }

  return points;
}

export function calculateDailySpending(
  transactions: Transaction[],
  monthKey: string
): DailySpendingPoint[] {
  const totalDays = getDaysInMonth(monthKey);
  const dailyTotals = new Array<number>(totalDays).fill(0);

  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.date.startsWith(monthKey)) continue;
    const dayNum = Number.parseInt(tx.date.slice(8, 10), 10);
    if (dayNum >= 1 && dayNum <= totalDays) {
      dailyTotals[dayNum - 1] += Math.round(tx.amount);
    }
  }

  return dailyTotals.map((amount, index) => {
    const day = index + 1;
    const dayStr = String(day).padStart(2, "0");
    return {
      day,
      date: `${monthKey}-${dayStr}`,
      amount,
    };
  });
}

export function calculateWeekdayVsWeekend(
  transactions: Transaction[],
  monthKey: string
): WeekdayWeekendSummary {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number.parseInt(yearStr, 10);
  const monthIndex = Number.parseInt(monthStr, 10) - 1;
  const totalDays = getDaysInMonth(monthKey);

  let weekdayCalendarDays = 0;
  let weekendCalendarDays = 0;

  for (let day = 1; day <= totalDays; day += 1) {
    const dayOfWeek = new Date(year, monthIndex, day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendCalendarDays += 1;
    } else {
      weekdayCalendarDays += 1;
    }
  }

  let weekdayTotal = 0;
  let weekendTotal = 0;

  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.date.startsWith(monthKey)) continue;
    const dayNum = Number.parseInt(tx.date.slice(8, 10), 10);
    const dayOfWeek = new Date(year, monthIndex, dayNum).getDay();
    const amount = Math.round(tx.amount);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendTotal += amount;
    } else {
      weekdayTotal += amount;
    }
  }

  const weekdayDailyAverage =
    weekdayCalendarDays > 0 ? Math.round(weekdayTotal / weekdayCalendarDays) : 0;
  const weekendDailyAverage =
    weekendCalendarDays > 0 ? Math.round(weekendTotal / weekendCalendarDays) : 0;

  let higherPeriod: "weekday" | "weekend" | "equal" = "equal";
  if (weekendDailyAverage > weekdayDailyAverage) {
    higherPeriod = "weekend";
  } else if (weekdayDailyAverage > weekendDailyAverage) {
    higherPeriod = "weekday";
  }

  return {
    weekdayTotal,
    weekendTotal,
    weekdayDailyAverage,
    weekendDailyAverage,
    higherPeriod,
  };
}

export function generateSmartInsights(
  summary: MonthlySummary,
  breakdown: CategoryBreakdownItem[],
  budgetStatuses: BudgetStatusItem[]
): SmartInsight[] {
  const insights: SmartInsight[] = [];

  if (breakdown.length > 0) {
    const top = breakdown[0];
    insights.push({
      id: "top-category",
      tone: "info",
      message: `${top.categoryName} menyerap ${formatPercent(top.sharePercent)} pengeluaran bulan ini (${formatIDR(top.amount)}).`,
    });
  }

  const criticalBudget = budgetStatuses.find(
    (item) => item.status === "exceeded" || item.status === "warning"
  );
  if (criticalBudget) {
    if (criticalBudget.status === "exceeded") {
      insights.push({
        id: "budget-exceeded",
        tone: "danger",
        message: `Anggaran ${criticalBudget.categoryName} melewati batas (${formatPercent(criticalBudget.usagePercent)}, lebih ${formatIDR(Math.abs(criticalBudget.remaining))}).`,
      });
    } else {
      insights.push({
        id: "budget-warning",
        tone: "warning",
        message: `Anggaran ${criticalBudget.categoryName} sudah terpakai ${formatPercent(criticalBudget.usagePercent)} (sisa ${formatIDR(criticalBudget.remaining)}).`,
      });
    }
  }

  if (summary.expenseMoMDelta !== null) {
    if (summary.expenseMoMDelta > 0) {
      insights.push({
        id: "mom-up",
        tone: "warning",
        message: `Pengeluaran naik ${formatPercent(summary.expenseMoMDelta)} dibanding bulan lalu.`,
      });
    } else if (summary.expenseMoMDelta < 0) {
      insights.push({
        id: "mom-down",
        tone: "positive",
        message: `Pengeluaran turun ${formatPercent(Math.abs(summary.expenseMoMDelta))} dibanding bulan lalu.`,
      });
    }
  } else if (summary.totalIncome > 0 && summary.savingRate > 0) {
    insights.push({
      id: "saving-rate",
      tone: "positive",
      message: `Saving rate bulan ini tercatat ${formatPercent(summary.savingRate)} dari total pemasukan.`,
    });
  }

  return insights.slice(0, 3);
}
