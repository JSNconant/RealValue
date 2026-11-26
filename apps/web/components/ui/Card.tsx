import { type HTMLAttributes } from "react";

type Variant = "default" | "bordered" | "flush" | "navy";

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Card({
  variant = "default",
  className = "",
  children,
  ...props
}: Props) {
  const cls = [
    "card",
    variant !== "default" && `card--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}
