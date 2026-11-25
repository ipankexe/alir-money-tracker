"use client";

import { useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Download,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CategoryIcon,
  SELECTABLE_CATEGORY_ICONS,
} from "@/components/ui/category-icon";
import { ErrorState, LoadingState } from "@/components/ui/state-views";
import { getTodayDateString } from "@/lib/format";
import { categoryInputSchema } from "@/lib/validators";
import { useFinance } from "@/store/finance-store";
import { useTheme } from "@/store/theme-store";
import { cn } from "@/lib/utils";
import type { CategoryType } from "@/types/finance";

const COLOR_SWATCHES = [
  "#EA580C",
  "#2563EB",
  "#059669",
  "#7C3AED",
  "#DC2626",
  "#0891B2",
  "#D97706",
  "#DB2777",
  "#475569",
];

export default function SettingsPage() {
  const {
    dataset,
    isLoading,
    error,
    retryLoad,
    addCategory,
    deleteCategory,
    resetDemoData,
    startFreshEmpty,
    exportBackupJson,
    importBackupJson,
    showToast,
  } = useFinance();
  const { theme, setTheme } = useTheme();

  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<CategoryType>("expense");
  const [catIcon, setCatIcon] = useState<string>("Coffee");
  const [catColor, setCatColor] = useState<string>(COLOR_SWATCHES[0]);
  const [catError, setCatError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"demo" | "empty" | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const catNameId = useId();
  const catTypeId = useId();

  if (isLoading) {
    return <LoadingState label="Memuat pengaturan aplikasi..." />;
  }

  if (error || !dataset) {
    return (
      <ErrorState
        message={error ?? "Pengaturan tidak dapat dimuat."}
        onRetry={retryLoad}
        onResetDemo={resetDemoData}
      />
    );
  }

  function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    const parsed = categoryInputSchema.safeParse({
      name: catName,
      type: catType,
      icon: catIcon,
      color: catColor,
    });

    if (!parsed.success) {
      setCatError(parsed.error.issues[0]?.message ?? "Periksa input kategori.");
      return;
    }

    addCategory(parsed.data);
    setCatName("");
    setCatError(null);
  }

  function handleDownloadBackup() {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `alir-backup-${getTodayDateString()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Backup JSON berhasil diunduh.");
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importBackupJson(String(reader.result ?? ""));
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Gagal memulihkan file JSON.",
          "error"
        );
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  const expenseCategories = dataset.categories.filter((c) => c.type === "expense");
  const incomeCategories = dataset.categories.filter((c) => c.type === "income");

  return (
    <div className="space-y-6">
      {/* Theme Appearance */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Tampilan Tema</CardTitle>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Pilihan tema tersimpan otomatis di browser ini
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                theme === "light"
                  ? "border-[var(--accent-primary)] bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]"
                  : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
              )}
            >
              <Sun className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">Mode Terang</p>
                <p className="text-xs opacity-85">
                  Kanvas terang bersih untuk pemakaian siang hari
                </p>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                theme === "dark"
                  ? "border-[var(--accent-primary)] bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]"
                  : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
              )}
            >
              <Moon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">Mode Gelap</p>
                <p className="text-xs opacity-85">
                  Permukaan gelap kontras tinggi untuk pencahayaan redup
                </p>
              </div>
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Portfolio & Data Management */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Kontrol Data & Mode Portofolio</CardTitle>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Seluruh data disimpan lokal di browser (Local-First) tanpa perlu login
            </p>
          </div>
          <Badge tone={dataset.isDemoMode ? "warning" : "income"}>
            {dataset.isDemoMode ? "Mode Demo Aktif" : "Data Pribadi"}
          </Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" size="sm" onClick={handleDownloadBackup}>
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Export Backup JSON</span>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="sr-only"
              aria-label="Import file backup JSON"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Import Backup JSON</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmAction("demo")}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reset ke Data Demo</span>
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmAction("empty")}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span>Mulai dari Kosong</span>
            </Button>
          </div>

          {confirmAction && (
            <div
              role="alertdialog"
              aria-label="Konfirmasi perubahan data"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] p-4"
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {confirmAction === "demo"
                  ? "Muat ulang data demo 3 bulan? Perubahan saat ini akan diganti dengan dataset demo."
                  : "Hapus semua transaksi dan anggaran untuk mulai dari kosong? Tindakan ini tidak bisa dibatalkan."}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setConfirmAction(null)}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  variant={confirmAction === "empty" ? "danger" : "primary"}
                  onClick={() => {
                    if (confirmAction === "demo") {
                      resetDemoData();
                    } else {
                      startFreshEmpty();
                    }
                    setConfirmAction(null);
                  }}
                >
                  {confirmAction === "demo"
                    ? "Ya, Muat Data Demo"
                    : "Ya, Bersihkan Data"}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Custom Categories Management */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Manajemen Kategori</CardTitle>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Tambahkan kategori kustom sesuai kebutuhan pencatatan harianmu
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <form
            onSubmit={handleAddCategory}
            className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-4"
          >
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Tambah Kategori Kustom
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={catNameId}
                  className="block text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Nama Kategori
                </label>
                <input
                  id={catNameId}
                  type="text"
                  maxLength={32}
                  placeholder="Contoh: Kopi Harian atau Dividen"
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    setCatError(null);
                  }}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label
                  htmlFor={catTypeId}
                  className="block text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Jenis Kategori
                </label>
                <select
                  id={catTypeId}
                  value={catType}
                  onChange={(e) => setCatType(e.target.value as CategoryType)}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>
            </div>

            <fieldset>
              <legend className="text-xs font-semibold text-[var(--text-secondary)]">
                Pilih Ikon
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {SELECTABLE_CATEGORY_ICONS.map((item) => {
                  const selected = catIcon === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setCatIcon(item.key)}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium",
                        selected
                          ? "border-[var(--accent-primary)] bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]"
                          : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      )}
                    >
                      <CategoryIcon iconKey={item.key} className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-semibold text-[var(--text-secondary)]">
                Pilih Warna
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((hex) => {
                  const selected = catColor === hex;
                  return (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Pilih warna ${hex}`}
                      aria-pressed={selected}
                      onClick={() => setCatColor(hex)}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-lg border",
                        selected
                          ? "border-[var(--text-primary)] ring-2 ring-[var(--focus-ring)]"
                          : "border-[var(--border-default)] bg-[var(--bg-surface)]"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="h-6 w-6 rounded-md"
                        style={{ backgroundColor: hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {catError && (
              <p role="alert" className="text-xs font-medium text-[var(--color-expense)]">
                {catError}
              </p>
            )}

            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Simpan Kategori</span>
            </Button>
          </form>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-2.5 text-sm font-bold text-[var(--text-primary)]">
                Kategori Pengeluaran ({expenseCategories.length})
              </h3>
              <ul className="space-y-2">
                {expenseCategories.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon iconKey={cat.icon} className="h-4 w-4" />
                      </span>
                      <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {cat.name}
                      </span>
                    </div>
                    {cat.isDefault ? (
                      <Badge>Bawaan</Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        aria-label={`Hapus kategori ${cat.name}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-expense)] hover:bg-[var(--color-expense-bg)]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2.5 text-sm font-bold text-[var(--text-primary)]">
                Kategori Pemasukan ({incomeCategories.length})
              </h3>
              <ul className="space-y-2">
                {incomeCategories.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon iconKey={cat.icon} className="h-4 w-4" />
                      </span>
                      <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {cat.name}
                      </span>
                    </div>
                    {cat.isDefault ? (
                      <Badge>Bawaan</Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        aria-label={`Hapus kategori ${cat.name}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-expense)] hover:bg-[var(--color-expense-bg)]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
