"use client";

import { type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "on-navy";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: Props) {
  const cls = [
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && "btn--full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2
          className="btn__spinner"
          size={size === "sm" ? 14 : 16}
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
