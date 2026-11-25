import {
  ArrowLeftRight,
  BookOpen,
  Briefcase,
  Car,
  CircleDot,
  Coffee,
  Film,
  Gift,
  HeartPulse,
  Home,
  Laptop,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Home,
  Car,
  Receipt,
  ShoppingBag,
  HeartPulse,
  Film,
  CircleDot,
  Briefcase,
  Laptop,
  TrendingUp,
  Coffee,
  Gift,
  BookOpen,
  Wallet,
  ArrowLeftRight,
};

export const SELECTABLE_CATEGORY_ICONS = [
  { key: "Utensils", label: "Makan" },
  { key: "Coffee", label: "Kopi" },
  { key: "Home", label: "Hunian" },
  { key: "Car", label: "Transport" },
  { key: "Receipt", label: "Tagihan" },
  { key: "ShoppingBag", label: "Belanja" },
  { key: "HeartPulse", label: "Kesehatan" },
  { key: "Film", label: "Hiburan" },
  { key: "BookOpen", label: "Edukasi" },
  { key: "Gift", label: "Hadiah" },
  { key: "Briefcase", label: "Gaji" },
  { key: "Laptop", label: "Proyek" },
  { key: "TrendingUp", label: "Investasi" },
  { key: "CircleDot", label: "Umum" },
] as const;

interface CategoryIconProps {
  iconKey: string;
  className?: string;
}

export function CategoryIcon({ iconKey, className = "h-4 w-4" }: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[iconKey] ?? CircleDot;
  return <Icon className={className} aria-hidden="true" strokeWidth={2} />;
}
