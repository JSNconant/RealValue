import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RealValue",
  description: "Know what a home may be worth — and why.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
