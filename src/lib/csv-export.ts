import type { Category, Transaction, Wallet } from "@/types/finance";

const TYPE_LABELS: Record<Transaction["type"], string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  transfer: "Transfer",
};

export function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  // Neutralize leading spreadsheet formula triggers while preserving numeric strings.
  const sanitized =
    typeof value === "string" && /^[=+@\t\r]/.test(raw) ? `'${raw}` : raw;

  if (/[",\r\n]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export function buildTransactionsCsv(
  transactions: Transaction[],
  wallets: Wallet[],
  categories: Category[]
): string {
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = [
    "Tanggal",
    "Jenis",
    "Kategori",
    "Dompet Asal",
    "Dompet Tujuan",
    "Nominal (IDR)",
    "Catatan",
  ];

  const rows = transactions.map((tx) => {
    const categoryName =
      tx.type === "transfer"
        ? "Transfer Antar Dompet"
        : (categoryMap.get(tx.categoryId ?? "") ?? "Lainnya");
    const fromWallet = walletMap.get(tx.walletId) ?? "-";
    const toWallet =
      tx.type === "transfer" ? (walletMap.get(tx.toWalletId ?? "") ?? "-") : "-";

    return [
      escapeCsvCell(tx.date),
      escapeCsvCell(TYPE_LABELS[tx.type]),
      escapeCsvCell(categoryName),
      escapeCsvCell(fromWallet),
      escapeCsvCell(toWallet),
      escapeCsvCell(Math.round(tx.amount)),
      escapeCsvCell(tx.note),
    ].join(",");
  });

  return `\uFEFF${[headers.map(escapeCsvCell).join(","), ...rows].join("\r\n")}`;
}

export function downloadTransactionsCsv(
  transactions: Transaction[],
  wallets: Wallet[],
  categories: Category[],
  filename: string
): void {
  const csvContent = buildTransactionsCsv(transactions, wallets, categories);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
