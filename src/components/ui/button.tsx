import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] active:scale-[0.99] border border-transparent",
  secondary:
    "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--bg-surface-subtle)] active:bg-[var(--border-default)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] active:bg-[var(--border-default)]",
  danger:
    "bg-[#BE123C] text-white hover:bg-[#9F1239] active:scale-[0.99] border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3.5 text-sm font-medium rounded-lg gap-1.5",
  md: "min-h-11 px-4 text-sm font-semibold rounded-lg gap-2",
  lg: "min-h-12 px-5 text-base font-semibold rounded-lg gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center transition-colors duration-150 disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
