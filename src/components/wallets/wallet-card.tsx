"use client";

import { ArrowLeftRight, CreditCard, Pencil } from "lucide-react";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WalletBalanceSummary, WalletTheme, WalletType } from "@/types/finance";

const THEME_GRADIENT_CLASS: Record<WalletTheme, string> = {
  blue: "wallet-gradient-blue",
  emerald: "wallet-gradient-emerald",
  coral: "wallet-gradient-coral",
  amber: "wallet-gradient-amber",
  violet: "wallet-gradient-violet",
};

const TYPE_LABEL: Record<WalletType, string> = {
  bank: "Rekening Bank",
  ewallet: "E-Wallet",
  cash: "Tunai",
};

interface WalletCardProps {
  summary: WalletBalanceSummary;
  compact?: boolean;
  onTransfer: (walletId: string) => void;
  onEdit?: (walletId: string) => void;
}

export function WalletCard({
  summary,
  compact = false,
  onTransfer,
  onEdit,
}: WalletCardProps) {
  const { wallet, balance, totalInflow, totalOutflow } = summary;

  return (
    <article
      className={cn(
        "flex flex-col justify-between rounded-xl p-4 text-white shadow-sm",
        THEME_GRADIENT_CLASS[wallet.theme],
        wallet.isArchived && "opacity-75"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/90">
            {TYPE_LABEL[wallet.type]}
            {wallet.isArchived ? " (Diarsipkan)" : ""}
          </p>
          <h3 className="mt-0.5 truncate text-base font-bold text-white">
            {wallet.name}
          </h3>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/20 text-white">
          <CreditCard className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className={cn("mt-4", !compact && "mt-5")}>
        <p className="text-xs font-medium text-white/90">Saldo aktif</p>
        <p className="mt-0.5 text-xl font-extrabold tracking-tight tabular-nums text-white sm:text-2xl">
          {formatIDR(balance)}
        </p>
        {wallet.accountMask && (
          <p className="mt-1 text-xs font-medium tracking-wider tabular-nums text-white/90">
            {wallet.accountMask}
          </p>
        )}
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-black/20 p-2.5 text-xs">
          <div>
            <span className="block text-white/85">Total masuk</span>
            <span className="mt-0.5 block font-semibold tabular-nums text-white">
              {formatIDR(totalInflow, true)}
            </span>
          </div>
          <div>
            <span className="block text-white/85">Total keluar</span>
            <span className="mt-0.5 block font-semibold tabular-nums text-white">
              {formatIDR(totalOutflow, true)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!wallet.isArchived && (
          <button
            type="button"
            onClick={() => onTransfer(wallet.id)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-black/25 px-3 text-xs font-semibold text-white hover:bg-black/35"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Transfer</span>
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(wallet.id)}
            aria-label={`Ubah dompet ${wallet.name}`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-black/25 px-3 text-xs font-semibold text-white hover:bg-black/35"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ubah</span>
          </button>
        )}
      </div>
    </article>
  );
}
