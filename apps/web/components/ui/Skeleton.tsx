import { type CSSProperties } from "react";

interface Props {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: CSSProperties;
  lines?: number;    // convenience: render N stacked lines
  gap?: number;      // gap between lines in px (default 8)
}

export function Skeleton({
  width,
  height = 20,
  borderRadius,
  className = "",
  style,
  lines,
  gap = 8,
}: Props) {
  if (lines && lines > 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap }}>
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className={`skeleton ${className}`}
            style={{
              display: "block",
              width: i === lines - 1 ? "60%" : width ?? "100%",
              height,
              borderRadius,
              ...style,
            }}
            aria-hidden
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={`skeleton ${className}`}
      style={{ display: "block", width, height, borderRadius, ...style }}
      aria-hidden
    />
  );
}
