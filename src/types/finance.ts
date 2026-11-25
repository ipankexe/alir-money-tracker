export type WalletType = "bank" | "ewallet" | "cash";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export type WalletTheme = "blue" | "emerald" | "coral" | "amber" | "violet";
export type BudgetHealth = "safe" | "warning" | "exceeded";
export type ThemeMode = "light" | "dark";

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  theme: WalletTheme;
  accountMask?: string;
  isArchived: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  walletId: string;
  toWalletId?: string;
  categoryId?: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  limitAmount: number;
}

export interface FinanceDataset {
  version: number;
  isDemoMode: boolean;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}

export interface WalletBalanceSummary {
  wallet: Wallet;
  balance: number;
  totalInflow: number;
  totalOutflow: number;
  transactionCount: number;
}

export interface MonthlySummary {
  monthKey: string;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  savingRate: number;
  previousMonthExpense: number;
  expenseMoMDelta: number | null;
  transactionCount: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  sharePercent: number;
  previousAmount: number;
  momDelta: number | null;
  transactionCount: number;
}

export interface BudgetStatusItem {
  budget: Budget;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  spent: number;
  remaining: number;
  usagePercent: number;
  status: BudgetHealth;
}

export interface CashflowTrendPoint {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface DailySpendingPoint {
  day: number;
  date: string;
  amount: number;
}

export interface WeekdayWeekendSummary {
  weekdayTotal: number;
  weekendTotal: number;
  weekdayDailyAverage: number;
  weekendDailyAverage: number;
  higherPeriod: "weekday" | "weekend" | "equal";
}

export interface SmartInsight {
  id: string;
  tone: "info" | "positive" | "warning" | "danger";
  message: string;
}
