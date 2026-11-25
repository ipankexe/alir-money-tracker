import { createDemoDataset, createEmptyDataset, DATASET_VERSION } from "@/lib/seed-data";
import type { FinanceDataset } from "@/types/finance";

export interface FinanceRepository {
  load(): FinanceDataset;
  save(dataset: FinanceDataset): void;
  resetToDemo(): FinanceDataset;
  clearAll(): FinanceDataset;
  exportJson(dataset: FinanceDataset): string;
  importJson(rawJson: string): FinanceDataset;
}

const STORAGE_KEY = "alir_finance_dataset_v1";

function isValidDatasetShape(value: unknown): value is FinanceDataset {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.wallets) &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.transactions) &&
    Array.isArray(candidate.budgets)
  );
}

export class LocalStorageFinanceRepository implements FinanceRepository {
  private readonly storageKey: string;

  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  load(): FinanceDataset {
    if (typeof window === "undefined") {
      return createDemoDataset();
    }

    const raw = window.localStorage.getItem(this.storageKey);
    if (!raw) {
      const demo = createDemoDataset();
      this.save(demo);
      return demo;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        "Data tersimpan di browser tidak valid atau rusak. Kamu bisa memulihkan ke Data Demo atau mulai dari kosong."
      );
    }

    if (!isValidDatasetShape(parsed)) {
      throw new Error(
        "Format penyimpanan lokal tidak sesuai versi aplikasi. Pulihkan ke Data Demo untuk melanjutkan."
      );
    }

    return {
      ...parsed,
      version: parsed.version ?? DATASET_VERSION,
      isDemoMode: Boolean(parsed.isDemoMode),
    };
  }

  save(dataset: FinanceDataset): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(dataset));
    } catch {
      throw new Error("Penyimpanan lokal penuh atau diblokir oleh browser.");
    }
  }

  resetToDemo(): FinanceDataset {
    const demo = createDemoDataset();
    this.save(demo);
    return demo;
  }

  clearAll(): FinanceDataset {
    const empty = createEmptyDataset();
    this.save(empty);
    return empty;
  }

  exportJson(dataset: FinanceDataset): string {
    return JSON.stringify(dataset, null, 2);
  }

  importJson(rawJson: string): FinanceDataset {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error("File JSON tidak dapat dibaca. Pastikan format JSON valid.");
    }

    if (!isValidDatasetShape(parsed)) {
      throw new Error(
        "Struktur file backup tidak lengkap. Wajib memuat wallets, categories, transactions, dan budgets."
      );
    }

    const normalized: FinanceDataset = {
      version: DATASET_VERSION,
      isDemoMode: Boolean(parsed.isDemoMode),
      wallets: parsed.wallets,
      categories: parsed.categories,
      transactions: parsed.transactions,
      budgets: parsed.budgets,
    };

    this.save(normalized);
    return normalized;
  }
}

export const financeRepository: FinanceRepository =
  new LocalStorageFinanceRepository();
