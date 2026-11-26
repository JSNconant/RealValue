import { type ReactNode } from "react";

type Variant = "blue" | "success" | "warning" | "error" | "neutral" | "sample";

interface Props {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className = "" }: Props) {
  return (
    <span className={`badge badge--${variant} ${className}`}>{children}</span>
  );
}
