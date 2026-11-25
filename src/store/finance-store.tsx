"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMonthKey } from "@/lib/format";
import { financeRepository } from "@/lib/storage/repository";
import { createId } from "@/lib/utils";
import type {
  BudgetInput,
  CategoryInput,
  TransactionInput,
  WalletInput,
} from "@/lib/validators";
import type {
  Budget,
  Category,
  FinanceDataset,
  Transaction,
  TransactionType,
  Wallet,
} from "@/types/finance";

export interface QuickAddOptions {
  defaultType?: TransactionType;
  defaultWalletId?: string;
  editingTransaction?: Transaction | null;
}

export interface ToastMessage {
  id: string;
  text: string;
  tone: "success" | "info" | "error";
}

interface FinanceContextValue {
  dataset: FinanceDataset | null;
  isLoading: boolean;
  error: string | null;
  selectedMonth: string;
  setSelectedMonth: (monthKey: string) => void;
  retryLoad: () => void;
  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  addWallet: (input: WalletInput) => void;
  updateWallet: (id: string, input: WalletInput) => void;
  toggleArchiveWallet: (id: string) => void;
  upsertBudget: (input: BudgetInput) => void;
  deleteBudget: (id: string) => void;
  addCategory: (input: CategoryInput) => void;
  deleteCategory: (id: string) => void;
  resetDemoData: () => void;
  startFreshEmpty: () => void;
  exportBackupJson: () => string;
  importBackupJson: (rawJson: string) => void;
  quickAddOpen: boolean;
  quickAddOptions: QuickAddOptions;
  openQuickAdd: (options?: QuickAddOptions) => void;
  closeQuickAdd: () => void;
  toast: ToastMessage | null;
  dismissToast: () => void;
  showToast: (text: string, tone?: ToastMessage["tone"]) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<FinanceDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getMonthKey());
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddOptions, setQuickAddOptions] = useState<QuickAddOptions>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (text: string, tone: ToastMessage["tone"] = "success") => {
      const id = createId("toast");
      setToast({ id, text, tone });
    },
    []
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = financeRepository.load();
      setDataset(loaded);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data keuangan dari penyimpanan lokal."
      );
      setDataset(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistUpdate = useCallback(
    (updater: (current: FinanceDataset) => FinanceDataset) => {
      setDataset((current) => {
        if (!current) return current;
        const next = updater(current);
        try {
          financeRepository.save(next);
          setError(null);
        } catch (err) {
          showToast(
            err instanceof Error
              ? err.message
              : "Gagal menyimpan perubahan ke penyimpanan lokal.",
            "error"
          );
        }
        return next;
      });
    },
    [showToast]
  );

  const addTransaction = useCallback(
    (input: TransactionInput) => {
      const newTx: Transaction = {
        id: createId("tx"),
        type: input.type,
        amount: Math.round(input.amount),
        walletId: input.walletId,
        toWalletId: input.type === "transfer" ? input.toWalletId : undefined,
        categoryId: input.type === "transfer" ? undefined : input.categoryId,
        note: input.note,
        date: input.date,
        createdAt: new Date().toISOString(),
      };
      persistUpdate((current) => ({
        ...current,
        transactions: [newTx, ...current.transactions],
      }));
      showToast("Transaksi berhasil dicatat.");
    },
    [persistUpdate, showToast]
  );

  const updateTransaction = useCallback(
    (id: string, input: TransactionInput) => {
      persistUpdate((current) => ({
        ...current,
        transactions: current.transactions.map((tx) =>
          tx.id === id
            ? {
                ...tx,
                type: input.type,
                amount: Math.round(input.amount),
                walletId: input.walletId,
                toWalletId:
                  input.type === "transfer" ? input.toWalletId : undefined,
                categoryId:
                  input.type === "transfer" ? undefined : input.categoryId,
                note: input.note,
                date: input.date,
              }
            : tx
        ),
      }));
      showToast("Perubahan transaksi disimpan.");
    },
    [persistUpdate, showToast]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      persistUpdate((current) => ({
        ...current,
        transactions: current.transactions.filter((tx) => tx.id !== id),
      }));
      showToast("Transaksi dihapus.", "info");
    },
    [persistUpdate, showToast]
  );

  const addWallet = useCallback(
    (input: WalletInput) => {
      const wallet: Wallet = {
        id: createId("w"),
        name: input.name,
        type: input.type,
        initialBalance: Math.round(input.initialBalance),
        theme: input.theme,
        accountMask: input.accountMask || undefined,
        isArchived: false,
      };
      persistUpdate((current) => ({
        ...current,
        wallets: [...current.wallets, wallet],
      }));
      showToast(`Dompet ${wallet.name} ditambahkan.`);
    },
    [persistUpdate, showToast]
  );

  const updateWallet = useCallback(
    (id: string, input: WalletInput) => {
      persistUpdate((current) => ({
        ...current,
        wallets: current.wallets.map((w) =>
          w.id === id
            ? {
                ...w,
                name: input.name,
                type: input.type,
                initialBalance: Math.round(input.initialBalance),
                theme: input.theme,
                accountMask: input.accountMask || undefined,
              }
            : w
        ),
      }));
      showToast("Data dompet diperbarui.");
    },
    [persistUpdate, showToast]
  );

  const toggleArchiveWallet = useCallback(
    (id: string) => {
      persistUpdate((current) => ({
        ...current,
        wallets: current.wallets.map((w) =>
          w.id === id ? { ...w, isArchived: !w.isArchived } : w
        ),
      }));
      showToast("Status arsip dompet diperbarui.", "info");
    },
    [persistUpdate, showToast]
  );

  const upsertBudget = useCallback(
    (input: BudgetInput) => {
      persistUpdate((current) => {
        const existingIndex = current.budgets.findIndex(
          (b) => b.categoryId === input.categoryId && b.month === input.month
        );
        if (existingIndex >= 0) {
          const updated = [...current.budgets];
          updated[existingIndex] = {
            ...updated[existingIndex],
            limitAmount: Math.round(input.limitAmount),
          };
          return { ...current, budgets: updated };
        }
        const nextBudget: Budget = {
          id: createId("bdg"),
          categoryId: input.categoryId,
          month: input.month,
          limitAmount: Math.round(input.limitAmount),
        };
        return { ...current, budgets: [...current.budgets, nextBudget] };
      });
      showToast("Batas anggaran disimpan.");
    },
    [persistUpdate, showToast]
  );

  const deleteBudget = useCallback(
    (id: string) => {
      persistUpdate((current) => ({
        ...current,
        budgets: current.budgets.filter((b) => b.id !== id),
      }));
      showToast("Anggaran dihapus.", "info");
    },
    [persistUpdate, showToast]
  );

  const addCategory = useCallback(
    (input: CategoryInput) => {
      const category: Category = {
        id: createId("cat"),
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color,
        isDefault: false,
      };
      persistUpdate((current) => ({
        ...current,
        categories: [...current.categories, category],
      }));
      showToast(`Kategori ${category.name} ditambahkan.`);
    },
    [persistUpdate, showToast]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      persistUpdate((current) => ({
        ...current,
        categories: current.categories.filter((c) => c.id !== id || c.isDefault),
      }));
      showToast("Kategori kustom dihapus.", "info");
    },
    [persistUpdate, showToast]
  );

  const resetDemoData = useCallback(() => {
    const demo = financeRepository.resetToDemo();
    setDataset(demo);
    setError(null);
    setSelectedMonth(getMonthKey());
    showToast("Data demo 3 bulan berhasil dimuat ulang.");
  }, [showToast]);

  const startFreshEmpty = useCallback(() => {
    const empty = financeRepository.clearAll();
    setDataset(empty);
    setError(null);
    setSelectedMonth(getMonthKey());
    showToast("Semua data transaksi dibersihkan. Siap mulai dari kosong.", "info");
  }, [showToast]);

  const exportBackupJson = useCallback(() => {
    if (!dataset) return "{}";
    return financeRepository.exportJson(dataset);
  }, [dataset]);

  const importBackupJson = useCallback(
    (rawJson: string) => {
      const imported = financeRepository.importJson(rawJson);
      setDataset(imported);
      setError(null);
      showToast("Backup JSON berhasil dipulihkan.");
    },
    [showToast]
  );

  const openQuickAdd = useCallback((options: QuickAddOptions = {}) => {
    setQuickAddOptions(options);
    setQuickAddOpen(true);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setQuickAddOpen(false);
    setQuickAddOptions({});
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      dataset,
      isLoading,
      error,
      selectedMonth,
      setSelectedMonth,
      retryLoad: loadData,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addWallet,
      updateWallet,
      toggleArchiveWallet,
      upsertBudget,
      deleteBudget,
      addCategory,
      deleteCategory,
      resetDemoData,
      startFreshEmpty,
      exportBackupJson,
      importBackupJson,
      quickAddOpen,
      quickAddOptions,
      openQuickAdd,
      closeQuickAdd,
      toast,
      dismissToast,
      showToast,
    }),
    [
      dataset,
      isLoading,
      error,
      selectedMonth,
      loadData,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addWallet,
      updateWallet,
      toggleArchiveWallet,
      upsertBudget,
      deleteBudget,
      addCategory,
      deleteCategory,
      resetDemoData,
      startFreshEmpty,
      exportBackupJson,
      importBackupJson,
      quickAddOpen,
      quickAddOptions,
      openQuickAdd,
      closeQuickAdd,
      toast,
      dismissToast,
      showToast,
    ]
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error("useFinance harus dipanggil di dalam FinanceProvider.");
  }
  return ctx;
}
