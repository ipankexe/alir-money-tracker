import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { FinanceProvider } from "@/store/finance-store";
import { ThemeProvider } from "@/store/theme-store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alir: Pencatat Keuangan & Arus Kas Pribadi",
  description:
    "Tahu persis ke mana uangmu mengalir. Pantau pemasukan, pengeluaran, transfer antar dompet, dan anggaran bulanan dalam Rupiah.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
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
