"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { generateInvestorDemoData, DEMO_USER_ID } from "@/lib/demo-seed";
import { saveUserStore, getUserStore } from "@/lib/store";
import {
  Home,
  Search,
  History,
  Bookmark,
  Download,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/search", label: "New search", icon: Search },
  { href: "/searches", label: "Searches", icon: History },
  { href: "/saved", label: "Saved homes", icon: Bookmark },
  { href: "/downloads", label: "Downloads", icon: Download },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: HelpCircle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");

  function handleQuickSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (quickSearch.trim().length >= 5) {
      router.push(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch("");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--color-page)" }}>
      {/* Desktop Left Sidebar */}
      <aside
        className="app-sidebar"
        style={{
          width: "var(--sidebar-width)",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-divider)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 50,
        }}
      >
        {/* Brand */}
        <div
          style={{
            height: "var(--app-top-height)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            borderBottom: "1px solid var(--color-divider)",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--color-ink)",
              letterSpacing: "-0.02em",
              textDecoration: "none",
            }}
          >
            RealValue
          </Link>
        </div>

        {/* Navigation list */}
        <nav style={{ padding: "16px 12px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-input)",
                  color: active ? "var(--color-trust)" : "var(--color-ink)",
                  background: active ? "var(--color-blue-tint)" : "transparent",
                  fontWeight: active ? 700 : 500,
                  fontSize: 15,
                  textDecoration: "none",
                  transition: "background var(--dur-fast), color var(--dur-fast)",
                }}
              >
                <Icon size={18} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & sign-out bottom block */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid var(--color-divider)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--color-blue-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-trust)",
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {user?.fullName ? user.fullName[0].toUpperCase() : <User size={16} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }} className="truncate">
                {user?.fullName || "Account"}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-secondary)" }} className="truncate">
                {user?.email || ""}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              router.push("/");
            }}
            title="Sign out"
            style={{
              background: "none",
              border: "none",
              color: "var(--color-secondary)",
              padding: 6,
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar with quick address lookup */}
        <header
          style={{
            height: "var(--app-top-height)",
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-divider)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          {/* Mobile brand & toggle */}
          <div style={{ display: "none" }} className="mobile-brand-wrap">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: "none", border: "none", padding: 8, color: "var(--color-ink)" }}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link
              href="/dashboard"
              style={{ fontWeight: 800, fontSize: 18, color: "var(--color-ink)", textDecoration: "none" }}
            >
              RealValue
            </Link>
          </div>

          {/* Quick search input in top bar */}
          <form
            onSubmit={handleQuickSearchSubmit}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 440 }}
          >
            <div style={{ position: "relative", width: "100%" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-secondary)",
                }}
              />
              <input
                type="text"
                placeholder="Search any address…"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  paddingLeft: 36,
                  paddingRight: 12,
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--color-divider)",
                  fontSize: 14,
                  background: "var(--color-page)",
                }}
              />
            </div>
          </form>

          {/* Top bar right info */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="badge badge--success" style={{ fontSize: 12 }}>
              Account Active
            </span>
            <Link
              href="/billing"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-trust)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              $4.00 / valuation
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "32px 24px 80px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
          {children}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav
          className="mobile-tab-bar"
          style={{
            display: "none",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: "var(--color-surface)",
            borderTop: "1px solid var(--color-divider)",
            zIndex: 100,
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          {[
            { href: "/dashboard", label: "Home", icon: Home },
            { href: "/search", label: "Search", icon: Search },
            { href: "/searches", label: "History", icon: History },
            { href: "/saved", label: "Saved", icon: Bookmark },
            { href: "/billing", label: "Billing", icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  color: active ? "var(--color-trust)" : "var(--color-secondary)",
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  textDecoration: "none",
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Responsive adjustments */}
      <style>{`
        @media (max-width: 900px) {
          .app-sidebar { display: none !important; }
          .mobile-brand-wrap { display: flex !important; align-items: center; gap: 8px; }
          .mobile-tab-bar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
