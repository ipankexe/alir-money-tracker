"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  Plus,
  Settings,
  Sun,
} from "lucide-react";
import { QuickAddTransactionModal } from "@/components/transactions/quick-add-modal";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MonthPicker } from "@/components/ui/month-picker";
import { ToastRegion } from "@/components/ui/toast";
import { useFinance } from "@/store/finance-store";
import { useTheme } from "@/store/theme-store";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  group: "Ringkasan" | "Kelola" | "Sistem";
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Beranda",
    icon: LayoutDashboard,
    group: "Ringkasan",
  },
  {
    href: "/analytics",
    label: "Analitik",
    shortLabel: "Analitik",
    icon: BarChart3,
    group: "Ringkasan",
  },
  {
    href: "/transactions",
    label: "Transaksi",
    shortLabel: "Transaksi",
    icon: ArrowLeftRight,
    group: "Kelola",
  },
  {
    href: "/budgets",
    label: "Anggaran",
    shortLabel: "Anggaran",
    icon: PiggyBank,
    group: "Kelola",
  },
  {
    href: "/wallets",
    label: "Dompet",
    shortLabel: "Dompet",
    icon: CreditCard,
    group: "Kelola",
  },
  {
    href: "/settings",
    label: "Pengaturan",
    shortLabel: "Pengaturan",
    icon: Settings,
    group: "Sistem",
  },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Ringkasan Arus Kas",
    subtitle: "Pantau ke mana uangmu mengalir bulan ini.",
  },
  "/transactions": {
    title: "Riwayat Transaksi",
    subtitle: "Cari, saring, ubah, dan ekspor catatan arus kas.",
  },
  "/analytics": {
    title: "Analitik Mendalam",
    subtitle: "Bandingkan tren 6 bulan, pola harian, dan perubahan kategori.",
  },
  "/budgets": {
    title: "Anggaran Bulanan",
    subtitle: "Kendalikan batas pengeluaran sebelum melewati target.",
  },
  "/wallets": {
    title: "Dompet & Transfer",
    subtitle: "Saldo realtime seluruh rekening bank, e-wallet, dan tunai.",
  },
  "/settings": {
    title: "Pengaturan & Data",
    subtitle: "Atur tema, kategori kustom, backup JSON, dan mode demo.",
  },
};

const GROUPS: NavItem["group"][] = ["Ringkasan", "Kelola", "Sistem"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { dataset, selectedMonth, setSelectedMonth, openQuickAdd } = useFinance();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pageMeta = PAGE_TITLES[pathname] ?? PAGE_TITLES["/"];
  const mobilePrimaryItems = NAV_ITEMS.slice(0, 4);
  const isOverflowRoute = pathname === "/wallets" || pathname === "/settings";

  return (
    <div className="min-h-dvh bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      <div className="flex min-h-dvh">
        {/* Desktop Sidebar */}
        <aside
          aria-label="Navigasi utama desktop"
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] transition-[width] duration-150 lg:flex",
            sidebarCollapsed ? "w-20" : "w-64"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-[var(--border-default)] px-4">
            <Link
              href="/"
              className="flex min-h-11 items-center gap-2.5 overflow-hidden rounded-lg px-1"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white"
              >
                <DollarSign className="h-4 w-4" strokeWidth={2.5} />
              </span>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <span className="block truncate text-base font-extrabold tracking-tight text-[var(--text-primary)]">
                    Alir
                  </span>
                  <span className="block truncate text-[11px] font-medium text-[var(--text-muted)]">
                    Arus Kas Pribadi
                  </span>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-expanded={!sidebarCollapsed}
              aria-label={
                sidebarCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"
              }
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)]"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="px-3 pt-4 pb-2">
            <Button
              onClick={() => openQuickAdd()}
              className={cn("w-full", sidebarCollapsed && "px-0")}
              aria-label="Catat transaksi baru"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span>Catat Transaksi</span>}
            </Button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
            {GROUPS.map((group) => {
              const items = NAV_ITEMS.filter((item) => item.group === group);
              return (
                <div key={group}>
                  {!sidebarCollapsed && (
                    <p className="mb-1.5 px-3 text-xs font-semibold text-[var(--text-muted)]">
                      {group}
                    </p>
                  )}
                  <ul className="space-y-1">
                    {items.map((item) => {
                      const active = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            title={sidebarCollapsed ? item.label : undefined}
                            className={cn(
                              "relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                              sidebarCollapsed && "justify-center px-0",
                              active
                                ? "bg-[var(--accent-soft-bg)] font-semibold text-[var(--accent-soft-text)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)]"
                            )}
                          >
                            {active && (
                              <span
                                aria-hidden="true"
                                className="absolute top-2 bottom-2 left-0 w-1 rounded-r bg-[var(--accent-primary)]"
                              />
                            )}
                            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                            {sidebarCollapsed && (
                              <span className="sr-only">{item.label}</span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-[var(--border-default)] p-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"
              }
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)]",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              {!sidebarCollapsed && (
                <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  href="/"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white lg:hidden"
                  aria-label="Alir Beranda"
                >
                  <DollarSign className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                </Link>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
                    {pageMeta.title}
                  </h1>
                  <p className="hidden truncate text-xs text-[var(--text-secondary)] sm:block">
                    {pageMeta.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {dataset?.isDemoMode && (
                  <Link
                    href="/settings"
                    className="inline-flex min-h-11 items-center rounded-lg border border-amber-700/30 bg-[var(--color-warning-bg)] px-3 text-xs font-semibold text-[var(--color-warning)] hover:opacity-90"
                  >
                    Mode Demo
                  </Link>
                )}

                <MonthPicker
                  monthKey={selectedMonth}
                  onChange={setSelectedMonth}
                />

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={
                    theme === "dark"
                      ? "Aktifkan mode terang"
                      : "Aktifkan mode gelap"
                  }
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] lg:hidden"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Moon className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>

                <Button
                  onClick={() => openQuickAdd()}
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Catat</span>
                </Button>
              </div>
            </div>
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-safe-bottom sm:px-6 lg:px-8 lg:pt-6"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Floating Quick-Add Action Button */}
      <button
        type="button"
        onClick={() => openQuickAdd()}
        aria-label="Catat transaksi baru"
        className="fixed right-4 bottom-20 z-40 inline-flex h-13 items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 text-sm font-bold text-white shadow-lg hover:bg-[var(--accent-primary-hover)] lg:hidden"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        <span>Catat</span>
      </button>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Navigasi utama mobile"
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-2 pt-1.5 pb-[calc(0.45rem+env(safe-area-inset-bottom,0px))] lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobilePrimaryItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-medium transition-colors",
                    active
                      ? "bg-[var(--accent-soft-bg)] font-semibold text-[var(--accent-soft-text)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{item.shortLabel}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              className={cn(
                "flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-medium transition-colors",
                isOverflowRoute
                  ? "bg-[var(--accent-soft-bg)] font-semibold text-[var(--accent-soft-text)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
              )}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
              <span>Menu</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile Overflow Navigation Sheet */}
      <Modal
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Menu Navigasi"
        description="Akses halaman Dompet, Pengaturan, dan seluruh fitur Alir."
      >
        <nav aria-label="Menu tambahan mobile" className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg border px-4 text-sm font-semibold",
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]"
                    : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </Modal>

      <QuickAddTransactionModal />
      <ToastRegion />
    </div>
  );
}
