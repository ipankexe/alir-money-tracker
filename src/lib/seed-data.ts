import { getDaysInMonth, getMonthKey, shiftMonthKey } from "@/lib/format";
import type {
  Budget,
  Category,
  FinanceDataset,
  Transaction,
  Wallet,
} from "@/types/finance";

export const DATASET_VERSION = 1;

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat-food",
    name: "Makanan & Minuman",
    type: "expense",
    icon: "Utensils",
    color: "#EA580C",
    isDefault: true,
  },
  {
    id: "cat-housing",
    name: "Kos & Tempat Tinggal",
    type: "expense",
    icon: "Home",
    color: "#2563EB",
    isDefault: true,
  },
  {
    id: "cat-transport",
    name: "Transportasi",
    type: "expense",
    icon: "Car",
    color: "#0891B2",
    isDefault: true,
  },
  {
    id: "cat-bills",
    name: "Tagihan & Langganan",
    type: "expense",
    icon: "Receipt",
    color: "#D97706",
    isDefault: true,
  },
  {
    id: "cat-shopping",
    name: "Belanja",
    type: "expense",
    icon: "ShoppingBag",
    color: "#7C3AED",
    isDefault: true,
  },
  {
    id: "cat-health",
    name: "Kesehatan",
    type: "expense",
    icon: "HeartPulse",
    color: "#DC2626",
    isDefault: true,
  },
  {
    id: "cat-entertainment",
    name: "Hiburan",
    type: "expense",
    icon: "Film",
    color: "#DB2777",
    isDefault: true,
  },
  {
    id: "cat-other-expense",
    name: "Lainnya",
    type: "expense",
    icon: "CircleDot",
    color: "#475569",
    isDefault: true,
  },
  {
    id: "cat-salary",
    name: "Gaji",
    type: "income",
    icon: "Briefcase",
    color: "#059669",
    isDefault: true,
  },
  {
    id: "cat-freelance",
    name: "Freelance & Proyek",
    type: "income",
    icon: "Laptop",
    color: "#0D9488",
    isDefault: true,
  },
  {
    id: "cat-bonus",
    name: "Bonus & Bunga",
    type: "income",
    icon: "TrendingUp",
    color: "#16A34A",
    isDefault: true,
  },
];

export const DEFAULT_DEMO_WALLETS: Wallet[] = [
  {
    id: "w-bca",
    name: "BCA Utama",
    type: "bank",
    initialBalance: 11_500_000,
    theme: "blue",
    accountMask: "•••• 4821",
    isArchived: false,
  },
  {
    id: "w-gopay",
    name: "GoPay",
    type: "ewallet",
    initialBalance: 650_000,
    theme: "emerald",
    accountMask: "0812 •••• 7742",
    isArchived: false,
  },
  {
    id: "w-seabank",
    name: "SeaBank",
    type: "bank",
    initialBalance: 5_800_000,
    theme: "coral",
    accountMask: "•••• 9104",
    isArchived: false,
  },
  {
    id: "w-cash",
    name: "Dompet Tunai",
    type: "cash",
    initialBalance: 550_000,
    theme: "amber",
    isArchived: false,
  },
];

function makeDate(monthKey: string, day: number): string {
  const maxDay = getDaysInMonth(monthKey);
  const clamped = Math.max(1, Math.min(day, maxDay));
  return `${monthKey}-${String(clamped).padStart(2, "0")}`;
}

export function createDemoDataset(referenceDate: Date = new Date()): FinanceDataset {
  const m0 = getMonthKey(referenceDate);
  const m1 = shiftMonthKey(m0, -1);
  const m2 = shiftMonthKey(m0, -2);
  const m3 = shiftMonthKey(m0, -3);

  const rawTx: Omit<Transaction, "id" | "createdAt">[] = [
    // 3 months ago (for 6-month trend depth)
    { type: "income", amount: 11_500_000, walletId: "w-bca", categoryId: "cat-salary", note: "Gaji bulanan", date: makeDate(m3, 1) },
    { type: "expense", amount: 2_300_000, walletId: "w-bca", categoryId: "cat-housing", note: "Sewa kos bulanan", date: makeDate(m3, 2) },
    { type: "expense", amount: 1_850_000, walletId: "w-gopay", categoryId: "cat-food", note: "Makan harian dan kopi", date: makeDate(m3, 14) },
    { type: "expense", amount: 640_000, walletId: "w-gopay", categoryId: "cat-transport", note: "KRL dan ojek online", date: makeDate(m3, 18) },
    { type: "expense", amount: 720_000, walletId: "w-bca", categoryId: "cat-bills", note: "Internet, listrik, dan langganan", date: makeDate(m3, 20) },

    // 2 months ago (M-2)
    { type: "income", amount: 11_500_000, walletId: "w-bca", categoryId: "cat-salary", note: "Gaji bulanan", date: makeDate(m2, 1) },
    { type: "income", amount: 2_400_000, walletId: "w-seabank", categoryId: "cat-freelance", note: "Audit desain UI klien", date: makeDate(m2, 15) },
    { type: "transfer", amount: 1_500_000, walletId: "w-bca", toWalletId: "w-gopay", note: "Top up saldo GoPay", date: makeDate(m2, 2) },
    { type: "transfer", amount: 2_000_000, walletId: "w-bca", toWalletId: "w-seabank", note: "Sisihkan dana darurat", date: makeDate(m2, 3) },
    { type: "expense", amount: 2_300_000, walletId: "w-bca", categoryId: "cat-housing", note: "Sewa kos bulanan", date: makeDate(m2, 2) },
    { type: "expense", amount: 520_000, walletId: "w-gopay", categoryId: "cat-food", note: "Makan siang kerja minggu 1-2", date: makeDate(m2, 8) },
    { type: "expense", amount: 280_000, walletId: "w-cash", categoryId: "cat-food", note: "Warteg dan jajanan pasar", date: makeDate(m2, 11) },
    { type: "expense", amount: 685_000, walletId: "w-gopay", categoryId: "cat-food", note: "Makan malam dan kopi bersama teman", date: makeDate(m2, 21) },
    { type: "expense", amount: 340_000, walletId: "w-gopay", categoryId: "cat-transport", note: "Ojek online dan MRT", date: makeDate(m2, 12) },
    { type: "expense", amount: 290_000, walletId: "w-cash", categoryId: "cat-transport", note: "Bensin motor dan parkir", date: makeDate(m2, 22) },
    { type: "expense", amount: 450_000, walletId: "w-bca", categoryId: "cat-bills", note: "Internet WiFi dan listrik token", date: makeDate(m2, 10) },
    { type: "expense", amount: 189_000, walletId: "w-bca", categoryId: "cat-bills", note: "Spotify, YouTube, dan cloud", date: makeDate(m2, 18) },
    { type: "expense", amount: 790_000, walletId: "w-bca", categoryId: "cat-shopping", note: "Kebutuhan harian dan sepatu lari", date: makeDate(m2, 19) },
    { type: "expense", amount: 260_000, walletId: "w-gopay", categoryId: "cat-entertainment", note: "Tiket bioskop dan buku", date: makeDate(m2, 25) },

    // Previous month (M-1)
    { type: "income", amount: 12_000_000, walletId: "w-bca", categoryId: "cat-salary", note: "Gaji bulanan", date: makeDate(m1, 1) },
    { type: "income", amount: 1_800_000, walletId: "w-seabank", categoryId: "cat-freelance", note: "Landing page portofolio klien", date: makeDate(m1, 16) },
    { type: "income", amount: 95_000, walletId: "w-seabank", categoryId: "cat-bonus", note: "Bunga tabungan SeaBank", date: makeDate(m1, 28) },
    { type: "transfer", amount: 1_800_000, walletId: "w-bca", toWalletId: "w-gopay", note: "Top up GoPay operasional", date: makeDate(m1, 2) },
    { type: "transfer", amount: 2_500_000, walletId: "w-bca", toWalletId: "w-seabank", note: "Tabungan bulanan ke SeaBank", date: makeDate(m1, 3) },
    { type: "expense", amount: 2_300_000, walletId: "w-bca", categoryId: "cat-housing", note: "Sewa kos bulanan", date: makeDate(m1, 2) },
    { type: "expense", amount: 460_000, walletId: "w-gopay", categoryId: "cat-food", note: "Makan siang dan kopi kantor", date: makeDate(m1, 6) },
    { type: "expense", amount: 315_000, walletId: "w-cash", categoryId: "cat-food", note: "Sarapan dan buah mingguan", date: makeDate(m1, 12) },
    { type: "expense", amount: 540_000, walletId: "w-gopay", categoryId: "cat-food", note: "Makan malam akhir pekan", date: makeDate(m1, 19) },
    { type: "expense", amount: 390_000, walletId: "w-gopay", categoryId: "cat-food", note: "Pesan antar makan siang", date: makeDate(m1, 26) },
    { type: "expense", amount: 380_000, walletId: "w-gopay", categoryId: "cat-transport", note: "Ojek online dan TransJakarta", date: makeDate(m1, 9) },
    { type: "expense", amount: 245_000, walletId: "w-cash", categoryId: "cat-transport", note: "Isi bensin dan servis ringan", date: makeDate(m1, 23) },
    { type: "expense", amount: 465_000, walletId: "w-bca", categoryId: "cat-bills", note: "Listrik token dan WiFi kos", date: makeDate(m1, 10) },
    { type: "expense", amount: 210_000, walletId: "w-bca", categoryId: "cat-bills", note: "Paket data dan langganan digital", date: makeDate(m1, 18) },
    { type: "expense", amount: 940_000, walletId: "w-bca", categoryId: "cat-shopping", note: "Kemeja kerja dan perlengkapan meja", date: makeDate(m1, 14) },
    { type: "expense", amount: 320_000, walletId: "w-bca", categoryId: "cat-health", note: "Vitamin dan cek kesehatan gigi", date: makeDate(m1, 21) },
    { type: "expense", amount: 295_000, walletId: "w-gopay", categoryId: "cat-entertainment", note: "Nonton bioskop dan kafe", date: makeDate(m1, 24) },

    // Current month (M0)
    { type: "income", amount: 12_000_000, walletId: "w-bca", categoryId: "cat-salary", note: "Gaji bulanan", date: makeDate(m0, 1) },
    { type: "income", amount: 2_250_000, walletId: "w-seabank", categoryId: "cat-freelance", note: "Pengembangan dashboard analitik", date: makeDate(m0, 12) },
    { type: "income", amount: 115_000, walletId: "w-seabank", categoryId: "cat-bonus", note: "Bunga tabungan bulanan", date: makeDate(m0, 20) },
    { type: "transfer", amount: 2_000_000, walletId: "w-bca", toWalletId: "w-gopay", note: "Top up GoPay dari BCA", date: makeDate(m0, 2) },
    { type: "transfer", amount: 2_500_000, walletId: "w-bca", toWalletId: "w-seabank", note: "Alokasi tabungan rutin", date: makeDate(m0, 3) },
    { type: "transfer", amount: 400_000, walletId: "w-bca", toWalletId: "w-cash", note: "Tarik tunai ATM", date: makeDate(m0, 7) },
    { type: "expense", amount: 2_300_000, walletId: "w-bca", categoryId: "cat-housing", note: "Sewa kos bulanan", date: makeDate(m0, 2) },
    { type: "expense", amount: 185_000, walletId: "w-gopay", categoryId: "cat-food", note: "Kopi susu dan makan siang tim", date: makeDate(m0, 4) },
    { type: "expense", amount: 240_000, walletId: "w-cash", categoryId: "cat-food", note: "Belanja sayur dan buah segar", date: makeDate(m0, 6) },
    { type: "expense", amount: 310_000, walletId: "w-gopay", categoryId: "cat-food", note: "Makan malam akhir pekan", date: makeDate(m0, 8) },
    { type: "expense", amount: 420_000, walletId: "w-gopay", categoryId: "cat-food", note: "Makan harian minggu kedua", date: makeDate(m0, 13) },
    { type: "expense", amount: 275_000, walletId: "w-gopay", categoryId: "cat-food", note: "Traktir kopi dan makan siang", date: makeDate(m0, 18) },
    { type: "expense", amount: 345_000, walletId: "w-cash", categoryId: "cat-food", note: "Makan malam keluarga", date: makeDate(m0, 22) },
    { type: "expense", amount: 195_000, walletId: "w-gopay", categoryId: "cat-transport", note: "Ojek online pulang pergi kantor", date: makeDate(m0, 5) },
    { type: "expense", amount: 165_000, walletId: "w-cash", categoryId: "cat-transport", note: "Bensin motor dan parkir", date: makeDate(m0, 14) },
    { type: "expense", amount: 210_000, walletId: "w-gopay", categoryId: "cat-transport", note: "Kereta bandara dan taksi online", date: makeDate(m0, 21) },
    { type: "expense", amount: 475_000, walletId: "w-bca", categoryId: "cat-bills", note: "Token listrik dan internet WiFi", date: makeDate(m0, 10) },
    { type: "expense", amount: 219_000, walletId: "w-bca", categoryId: "cat-bills", note: "Langganan cloud, musik, dan pulsa", date: makeDate(m0, 17) },
    { type: "expense", amount: 680_000, walletId: "w-bca", categoryId: "cat-shopping", note: "Keyboard mekanik untuk kerja", date: makeDate(m0, 11) },
    { type: "expense", amount: 495_000, walletId: "w-bca", categoryId: "cat-shopping", note: "Kebutuhan rumah tangga dan skincare", date: makeDate(m0, 19) },
    { type: "expense", amount: 280_000, walletId: "w-bca", categoryId: "cat-health", note: "Keanggotaan gym bulanan", date: makeDate(m0, 9) },
    { type: "expense", amount: 330_000, walletId: "w-gopay", categoryId: "cat-entertainment", note: "Bioskop akhir pekan dan konser lokal", date: makeDate(m0, 15) },
  ];

  const transactions: Transaction[] = rawTx.map((item, idx) => ({
    ...item,
    id: `tx-demo-${idx + 1}`,
    createdAt: `${item.date}T${String(9 + (idx % 10)).padStart(2, "0")}:15:00.000Z`,
  }));

  const createBudgetsForMonth = (monthKey: string, prefix: string): Budget[] => [
    // Food in M0: 1.775.000 / 2.000.000 = 88.8% (warning)
    { id: `${prefix}-food`, categoryId: "cat-food", month: monthKey, limitAmount: 2_000_000 },
    // Shopping in M0: 1.175.000 / 1.000.000 = 117.5% (exceeded)
    { id: `${prefix}-shopping`, categoryId: "cat-shopping", month: monthKey, limitAmount: 1_000_000 },
    // Transport in M0: 570.000 / 800.000 = 71.3% (safe)
    { id: `${prefix}-transport`, categoryId: "cat-transport", month: monthKey, limitAmount: 800_000 },
    // Bills in M0: 694.000 / 900.000 = 77.1% (safe)
    { id: `${prefix}-bills`, categoryId: "cat-bills", month: monthKey, limitAmount: 900_000 },
    // Entertainment in M0: 330.000 / 600.000 = 55.0% (safe)
    { id: `${prefix}-entertainment`, categoryId: "cat-entertainment", month: monthKey, limitAmount: 600_000 },
  ];

  const budgets: Budget[] = [
    ...createBudgetsForMonth(m0, "bdg-m0"),
    ...createBudgetsForMonth(m1, "bdg-m1"),
    ...createBudgetsForMonth(m2, "bdg-m2"),
  ];

  return {
    version: DATASET_VERSION,
    isDemoMode: true,
    wallets: DEFAULT_DEMO_WALLETS,
    categories: DEFAULT_CATEGORIES,
    transactions,
    budgets,
  };
}

export function createEmptyDataset(): FinanceDataset {
  return {
    version: DATASET_VERSION,
    isDemoMode: false,
    wallets: [
      {
        id: "w-default-cash",
        name: "Dompet Utama",
        type: "cash",
        initialBalance: 0,
        theme: "blue",
        isArchived: false,
      },
    ],
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    budgets: [],
  };
}
