import { describe, expect, it } from "vitest";
import { buildTransactionsCsv, escapeCsvCell } from "@/lib/csv-export";
import {
  calculateBudgetStatuses,
  calculateCashflowTrend,
  calculateCategoryBreakdown,
  calculateDailySpending,
  calculateMoMDelta,
  calculateMonthlySummary,
  calculateSavingRate,
  calculateTotalNetWorth,
  calculateWalletBalances,
  calculateWeekdayVsWeekend,
  generateSmartInsights,
} from "@/lib/finance-engine";
import { getMonthKey } from "@/lib/format";
import { createDemoDataset, createEmptyDataset } from "@/lib/seed-data";
import { transactionInputSchema } from "@/lib/validators";
import type { Budget, Category, Transaction, Wallet } from "@/types/finance";

const sampleWallets: Wallet[] = [
  {
    id: "w-bca",
    name: "BCA Utama",
    type: "bank",
    initialBalance: 5_000_000,
    theme: "blue",
    isArchived: false,
  },
  {
    id: "w-gopay",
    name: "GoPay",
    type: "ewallet",
    initialBalance: 500_000,
    theme: "emerald",
    isArchived: false,
  },
];

const sampleCategories: Category[] = [
  {
    id: "c-food",
    name: "Makanan & Minuman",
    type: "expense",
    icon: "Utensils",
    color: "#EA580C",
    isDefault: true,
  },
  {
    id: "c-shop",
    name: "Belanja",
    type: "expense",
    icon: "ShoppingBag",
    color: "#7C3AED",
    isDefault: true,
  },
  {
    id: "c-salary",
    name: "Gaji",
    type: "income",
    icon: "Briefcase",
    color: "#059669",
    isDefault: true,
  },
];

describe("calculateWalletBalances and Net Worth", () => {
  it("computes balances across income, expense, and transfers without altering net worth on transfer", () => {
    const transactions: Transaction[] = [
      {
        id: "t1",
        type: "income",
        amount: 10_000_000,
        walletId: "w-bca",
        categoryId: "c-salary",
        note: "Gaji November",
        date: "2026-11-01",
        createdAt: "2026-11-01T08:00:00.000Z",
      },
      {
        id: "t2",
        type: "transfer",
        amount: 1_500_000,
        walletId: "w-bca",
        toWalletId: "w-gopay",
        note: "Top up GoPay",
        date: "2026-11-02",
        createdAt: "2026-11-02T08:00:00.000Z",
      },
      {
        id: "t3",
        type: "expense",
        amount: 250_000,
        walletId: "w-gopay",
        categoryId: "c-food",
        note: "Makan siang tim",
        date: "2026-11-03",
        createdAt: "2026-11-03T12:00:00.000Z",
      },
    ];

    const balances = calculateWalletBalances(sampleWallets, transactions);
    const bca = balances.find((b) => b.wallet.id === "w-bca");
    const gopay = balances.find((b) => b.wallet.id === "w-gopay");

    expect(bca?.balance).toBe(13_500_000);
    expect(gopay?.balance).toBe(1_750_000);
    expect(calculateTotalNetWorth(balances)).toBe(15_250_000);
  });
});

describe("calculateMonthlySummary, Saving Rate, and MoM Delta", () => {
  it("excludes transfers from monthly income and expense totals", () => {
    const transactions: Transaction[] = [
      {
        id: "t-prev",
        type: "expense",
        amount: 2_000_000,
        walletId: "w-bca",
        categoryId: "c-food",
        note: "Oktober",
        date: "2026-10-10",
        createdAt: "2026-10-10T10:00:00.000Z",
      },
      {
        id: "t-inc",
        type: "income",
        amount: 10_000_000,
        walletId: "w-bca",
        categoryId: "c-salary",
        note: "Gaji",
        date: "2026-11-01",
        createdAt: "2026-11-01T10:00:00.000Z",
      },
      {
        id: "t-exp",
        type: "expense",
        amount: 2_500_000,
        walletId: "w-bca",
        categoryId: "c-food",
        note: "November",
        date: "2026-11-05",
        createdAt: "2026-11-05T10:00:00.000Z",
      },
      {
        id: "t-trf",
        type: "transfer",
        amount: 3_000_000,
        walletId: "w-bca",
        toWalletId: "w-gopay",
        note: "Transfer tidak dihitung pengeluaran",
        date: "2026-11-06",
        createdAt: "2026-11-06T10:00:00.000Z",
      },
    ];

    const summary = calculateMonthlySummary(transactions, "2026-11");

    expect(summary.totalIncome).toBe(10_000_000);
    expect(summary.totalExpense).toBe(2_500_000);
    expect(summary.netCashflow).toBe(7_500_000);
    expect(summary.savingRate).toBe(75);
    expect(summary.expenseMoMDelta).toBe(25);
  });

  it("handles zero income without producing NaN or Infinity", () => {
    expect(calculateSavingRate(0, 500_000)).toBe(0);
    expect(calculateSavingRate(0, 0)).toBe(0);
  });

  it("returns null MoM delta when previous month expense is zero", () => {
    expect(calculateMoMDelta(1_000_000, 0)).toBeNull();
  });
});

describe("calculateBudgetStatuses", () => {
  it("classifies safe (<80%), warning (80-99%), and exceeded (>=100%) budgets sorted by usage", () => {
    const budgets: Budget[] = [
      { id: "b-safe", categoryId: "c-food", month: "2026-11", limitAmount: 1_000_000 },
      { id: "b-warn", categoryId: "c-shop", month: "2026-11", limitAmount: 1_000_000 },
    ];

    const transactions: Transaction[] = [
      {
        id: "e1",
        type: "expense",
        amount: 790_000,
        walletId: "w-bca",
        categoryId: "c-food",
        note: "Makan",
        date: "2026-11-04",
        createdAt: "2026-11-04T10:00:00.000Z",
      },
      {
        id: "e2",
        type: "expense",
        amount: 850_000,
        walletId: "w-bca",
        categoryId: "c-shop",
        note: "Belanja",
        date: "2026-11-08",
        createdAt: "2026-11-08T10:00:00.000Z",
      },
      {
        id: "t-ignored",
        type: "transfer",
        amount: 500_000,
        walletId: "w-bca",
        toWalletId: "w-gopay",
        note: "Top up",
        date: "2026-11-09",
        createdAt: "2026-11-09T10:00:00.000Z",
      },
    ];

    const statuses = calculateBudgetStatuses(
      budgets,
      transactions,
      sampleCategories,
      "2026-11"
    );

    expect(statuses[0].budget.id).toBe("b-warn");
    expect(statuses[0].status).toBe("warning");
    expect(statuses[0].usagePercent).toBe(85);
    expect(statuses[1].budget.id).toBe("b-safe");
    expect(statuses[1].status).toBe("safe");

    const exceeded = calculateBudgetStatuses(
      budgets,
      [
        ...transactions,
        {
          id: "e3",
          type: "expense",
          amount: 200_000,
          walletId: "w-bca",
          categoryId: "c-shop",
          note: "Tambahan",
          date: "2026-11-12",
          createdAt: "2026-11-12T10:00:00.000Z",
        },
      ],
      sampleCategories,
      "2026-11"
    );

    expect(exceeded[0].status).toBe("exceeded");
    expect(exceeded[0].remaining).toBe(-50_000);
  });
});

describe("analytics helpers and smart insights", () => {
  it("computes category breakdown, 6-month trend, daily spending, weekday vs weekend, and insights", () => {
    const transactions: Transaction[] = [
      {
        id: "tx1",
        type: "expense",
        amount: 600_000,
        walletId: "w-bca",
        categoryId: "c-food",
        note: "Senin",
        date: "2026-11-02", // Monday
        createdAt: "2026-11-02T10:00:00.000Z",
      },
      {
        id: "tx2",
        type: "expense",
        amount: 400_000,
        walletId: "w-bca",
        categoryId: "c-shop",
        note: "Sabtu",
        date: "2026-11-07", // Saturday
        createdAt: "2026-11-07T10:00:00.000Z",
      },
    ];

    const breakdown = calculateCategoryBreakdown(transactions, sampleCategories, "2026-11");
    expect(breakdown[0].categoryId).toBe("c-food");
    expect(breakdown[0].sharePercent).toBe(60);

    const trend = calculateCashflowTrend(transactions, "2026-11", 6);
    expect(trend).toHaveLength(6);
    expect(trend[5].monthKey).toBe("2026-11");
    expect(trend[5].expense).toBe(1_000_000);

    const daily = calculateDailySpending(transactions, "2026-11");
    expect(daily).toHaveLength(30);
    expect(daily[1].amount).toBe(600_000);

    const ww = calculateWeekdayVsWeekend(transactions, "2026-11");
    expect(ww.weekdayTotal).toBe(600_000);
    expect(ww.weekendTotal).toBe(400_000);

    const summary = calculateMonthlySummary(transactions, "2026-11");
    const insights = generateSmartInsights(summary, breakdown, []);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].message).toContain("Makanan & Minuman");
  });
});

describe("validators and CSV export", () => {
  it("rejects transfer to the same wallet and non-positive amounts", () => {
    const sameWallet = transactionInputSchema.safeParse({
      type: "transfer",
      amount: 100_000,
      walletId: "w-bca",
      toWalletId: "w-bca",
      note: "Self",
      date: "2026-11-10",
    });
    expect(sameWallet.success).toBe(false);

    const zeroAmount = transactionInputSchema.safeParse({
      type: "expense",
      amount: 0,
      walletId: "w-bca",
      categoryId: "c-food",
      note: "Zero",
      date: "2026-11-10",
    });
    expect(zeroAmount.success).toBe(false);
  });

  it("escapes commas, quotes, newlines, and formula prefixes with UTF-8 BOM", () => {
    expect(escapeCsvCell('Kopi, "Susu"\nPagi')).toBe('"Kopi, ""Susu""\nPagi"');
    expect(escapeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");

    const csv = buildTransactionsCsv(
      [
        {
          id: "t1",
          type: "expense",
          amount: 45_000,
          walletId: "w-gopay",
          categoryId: "c-food",
          note: 'Kopi, "Aren"',
          date: "2026-11-15",
          createdAt: "2026-11-15T09:00:00.000Z",
        },
      ],
      sampleWallets,
      sampleCategories
    );

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Kopi, ""Aren"""');
    expect(csv).toContain("45000");
  });
});

describe("seed datasets", () => {
  it("generates realistic Indonesian demo data with mixed budget statuses for the current month", () => {
    const refDate = new Date("2026-11-25T10:00:00.000Z");
    const monthKey = getMonthKey(refDate);
    const demo = createDemoDataset(refDate);

    expect(demo.isDemoMode).toBe(true);
    expect(demo.wallets).toHaveLength(4);
    expect(demo.categories).toHaveLength(11);
    expect(demo.transactions.some((tx) => tx.type === "transfer")).toBe(true);

    const statuses = calculateBudgetStatuses(
      demo.budgets,
      demo.transactions,
      demo.categories,
      monthKey
    );
    expect(statuses.some((s) => s.status === "exceeded")).toBe(true);
    expect(statuses.some((s) => s.status === "warning")).toBe(true);
    expect(statuses.some((s) => s.status === "safe")).toBe(true);
  });

  it("creates a clean empty dataset for start-fresh mode", () => {
    const empty = createEmptyDataset();
    expect(empty.isDemoMode).toBe(false);
    expect(empty.wallets).toHaveLength(1);
    expect(empty.transactions).toHaveLength(0);
    expect(empty.budgets).toHaveLength(0);
    expect(empty.categories).toHaveLength(11);
  });
});
