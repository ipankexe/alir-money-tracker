import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { FinanceProvider } from "@/store/finance-store";
import { ThemeProvider } from "@/store/theme-store";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alir: Pencatat Keuangan & Arus Kas Pribadi",
  description:
    "Tahu persis ke mana uangmu mengalir. Pantau pemasukan, pengeluaran, transfer antar dompet, dan anggaran bulanan dalam Rupiah.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <FinanceProvider>
            <AppShell>{children}</AppShell>
          </FinanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
