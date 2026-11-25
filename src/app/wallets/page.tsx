"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { Archive, ArrowLeftRight, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-views";
import { WalletCard } from "@/components/wallets/wallet-card";
import {
  calculateTotalNetWorth,
  calculateWalletBalances,
} from "@/lib/finance-engine";
import { formatIDR, formatNumberInput, parseIDRInput } from "@/lib/format";
import { walletInputSchema } from "@/lib/validators";
import { useFinance } from "@/store/finance-store";
import { cn } from "@/lib/utils";
import type { Wallet, WalletTheme, WalletType } from "@/types/finance";

const WALLET_THEMES: { key: WalletTheme; label: string; swatch: string }[] = [
  { key: "blue", label: "Biru Bank", swatch: "bg-[#1D4ED8]" },
  { key: "emerald", label: "Hijau E-Wallet", swatch: "bg-[#047857]" },
  { key: "coral", label: "Oranye Digital", swatch: "bg-[#C2410C]" },
  { key: "amber", label: "Emas Tunai", swatch: "bg-[#A16207]" },
  { key: "violet", label: "Ungu Tabungan", swatch: "bg-[#6D28D9]" },
];

export default function WalletsPage() {
  const {
    dataset,
    isLoading,
    error,
    retryLoad,
    resetDemoData,
    addWallet,
    updateWallet,
    toggleArchiveWallet,
    openQuickAdd,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("bank");
  const [initialBalance, setInitialBalance] = useState(0);
  const [theme, setTheme] = useState<WalletTheme>("blue");
  const [accountMask, setAccountMask] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const nameId = useId();
  const typeId = useId();
  const balanceId = useId();
  const maskId = useId();

  const walletSummaries = useMemo(() => {
    if (!dataset) return [];
    return calculateWalletBalances(dataset.wallets, dataset.transactions);
  }, [dataset]);

  const activeSummaries = useMemo(
    () => walletSummaries.filter((s) => !s.wallet.isArchived),
    [walletSummaries]
  );
  const archivedSummaries = useMemo(
    () => walletSummaries.filter((s) => s.wallet.isArchived),
    [walletSummaries]
  );
  const totalNetWorth = useMemo(
    () => calculateTotalNetWorth(walletSummaries),
    [walletSummaries]
  );

  if (isLoading) {
    return <LoadingState label="Memuat daftar dompet..." />;
  }

  if (error || !dataset) {
    return (
      <ErrorState
        message={error ?? "Data dompet tidak tersedia."}
        onRetry={retryLoad}
        onResetDemo={resetDemoData}
      />
    );
  }

  function openCreateModal() {
    setEditingWallet(null);
    setName("");
    setType("bank");
    setInitialBalance(0);
    setTheme("blue");
    setAccountMask("");
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(walletId: string) {
    const target = dataset?.wallets.find((w) => w.id === walletId);
    if (!target) return;
    setEditingWallet(target);
    setName(target.name);
    setType(target.type);
    setInitialBalance(target.initialBalance);
    setTheme(target.theme);
    setAccountMask(target.accountMask ?? "");
    setFormError(null);
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = walletInputSchema.safeParse({
      name,
      type,
      initialBalance,
      theme,
      accountMask: accountMask || undefined,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Periksa kembali data dompet.");
      return;
    }

    if (editingWallet) {
      updateWallet(editingWallet.id, parsed.data);
    } else {
      addWallet(parsed.data);
    }
    setModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <Card elevated>
        <CardBody className="flex flex-wrap items-center justify-between gap-4 pt-5">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">
              Total Saldo Dompet Aktif ({activeSummaries.length} dompet)
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-[var(--text-primary)] sm:text-3xl">
              {formatIDR(totalNetWorth)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openQuickAdd({ defaultType: "transfer" })}
              disabled={activeSummaries.length < 2}
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              <span>Transfer Antar Dompet</span>
            </Button>
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah Dompet</span>
            </Button>
          </div>
        </CardBody>
      </Card>

      {activeSummaries.length === 0 ? (
        <EmptyState
          title="Belum ada dompet aktif"
          description="Tambahkan rekening bank, e-wallet, atau dompet tunai untuk mulai melacak saldo."
          actionLabel="Tambah Dompet Pertama"
          onAction={openCreateModal}
        />
      ) : (
        <section aria-label="Dompet aktif">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeSummaries.map((summary) => (
              <div key={summary.wallet.id} className="space-y-2">
                <WalletCard
                  summary={summary}
                  onTransfer={(walletId) =>
                    openQuickAdd({
                      defaultType: "transfer",
                      defaultWalletId: walletId,
                    })
                  }
                  onEdit={openEditModal}
                />
                <div className="flex items-center justify-between px-1 text-xs text-[var(--text-secondary)]">
                  <span>{summary.transactionCount} transaksi tercatat</span>
                  <button
                    type="button"
                    onClick={() => toggleArchiveWallet(summary.wallet.id)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)]"
                  >
                    <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Arsipkan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {archivedSummaries.length > 0 && (
        <section aria-label="Dompet yang diarsipkan" className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-[var(--text-secondary)]">
            Dompet Diarsipkan ({archivedSummaries.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archivedSummaries.map((summary) => (
              <Card
                key={summary.wallet.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                    {summary.wallet.name}
                  </p>
                  <p className="text-xs tabular-nums text-[var(--text-secondary)]">
                    Saldo terakhir: {formatIDR(summary.balance)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleArchiveWallet(summary.wallet.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Aktifkan</span>
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWallet ? "Ubah Dompet" : "Tambah Dompet Baru"}
        description="Saldo dompet akan otomatis mengikuti saldo awal ditambah seluruh transaksi."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor={nameId}
              className="block text-sm font-medium text-[var(--text-secondary)]"
            >
              Nama Dompet
            </label>
            <input
              id={nameId}
              type="text"
              placeholder="Contoh: Mandiri Tabungan atau OVO"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFormError(null);
              }}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={typeId}
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                Jenis Dompet
              </label>
              <select
                id={typeId}
                value={type}
                onChange={(e) => setType(e.target.value as WalletType)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="bank">Rekening Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="cash">Tunai</option>
              </select>
            </div>

            <div>
              <label
                htmlFor={balanceId}
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                Saldo Awal (Rupiah)
              </label>
              <div className="relative mt-1.5">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)]"
                >
                  Rp
                </span>
                <input
                  id={balanceId}
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatNumberInput(initialBalance)}
                  onChange={(e) =>
                    setInitialBalance(parseIDRInput(e.target.value))
                  }
                  className="min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] pr-3 pl-9 text-sm font-bold tabular-nums text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor={maskId}
              className="block text-sm font-medium text-[var(--text-secondary)]"
            >
              Label Nomor Akun (opsional)
            </label>
            <input
              id={maskId}
              type="text"
              maxLength={16}
              placeholder="Contoh: •••• 1234"
              value={accountMask}
              onChange={(e) => setAccountMask(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-[var(--text-secondary)]">
              Warna Kartu
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {WALLET_THEMES.map((item) => {
                const selected = theme === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTheme(item.key)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs font-semibold",
                      selected
                        ? "border-[var(--accent-primary)] bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]"
                        : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("h-3.5 w-3.5 rounded-full", item.swatch)}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {formError && (
            <p role="alert" className="text-xs font-medium text-[var(--color-expense)]">
              {formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">
              {editingWallet ? "Simpan Perubahan" : "Tambah Dompet"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
