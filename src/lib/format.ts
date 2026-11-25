const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const SHORT_MONTH_NAMES_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function formatIDR(amount: number, compact = false): string {
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded);
  const sign = rounded < 0 ? "-" : "";

  if (compact) {
    if (abs >= 1_000_000_000) {
      const val = (abs / 1_000_000_000).toFixed(1).replace(".", ",").replace(/,0$/, "");
      return `${sign}Rp ${val} M`;
    }
    if (abs >= 1_000_000) {
      const val = (abs / 1_000_000).toFixed(2).replace(".", ",").replace(/,?0+$/, "");
      return `${sign}Rp ${val} jt`;
    }
    if (abs >= 1_000) {
      const val = Math.round(abs / 1_000);
      return `${sign}Rp ${val} rb`;
    }
  }

  return idrFormatter.format(rounded).replace(/\u00a0/g, " ");
}

export function formatNumberInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return numberFormatter.format(Math.round(value));
}

export function parseIDRInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPercent(value: number, decimals = 1): string {
  const formatted = value.toFixed(decimals).replace(".", ",");
  return `${formatted}%`;
}

export function formatSignedPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPercent(value, decimals)}`;
}

export function getMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number.parseInt(yearStr, 10);
  const monthIndex = Number.parseInt(monthStr, 10) - 1;
  const date = new Date(year, monthIndex + deltaMonths, 1);
  return getMonthKey(date);
}

export function formatMonthLabel(monthKey: string, short = false): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const monthIndex = Number.parseInt(monthStr, 10) - 1;
  const names = short ? SHORT_MONTH_NAMES_ID : MONTH_NAMES_ID;
  const monthName = names[monthIndex] ?? monthStr;
  return `${monthName} ${yearStr}`;
}

export function formatShortDate(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const monthIndex = Number.parseInt(monthStr, 10) - 1;
  const day = Number.parseInt(dayStr, 10);
  const monthName = SHORT_MONTH_NAMES_ID[monthIndex] ?? monthStr;
  return `${day} ${monthName} ${yearStr}`;
}

export function getDaysInMonth(monthKey: string): number {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  return new Date(year, month, 0).getDate();
}
