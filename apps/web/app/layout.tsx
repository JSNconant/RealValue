import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../lib/auth-context";

export const metadata: Metadata = {
  title: {
    default: "RealValue — Know what a home is really worth",
    template: "%s | RealValue",
  },
  description:
    "Enter an address. See an estimated value, a likely range and the reasons behind it. A computer-generated estimate, not an appraisal.",
  robots: { index: false, follow: false }, // keep dark until launch
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1F3A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
