"use client";

/**
 * Landing page — logged-out home
 * 9 sections as specified:
 * 1. Sticky nav
 * 2. Hero + address search
 * 3. Signature scroll scene (SVG house assembles, value card rises)
 * 4. How it works (3 steps)
 * 5. Feature bento grid
 * 6. Transparency section (navy)
 * 7. Pricing
 * 8. FAQ accordion
 * 9. CTA + footer
 */

import { useState, useRef, useEffect, useId } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Search,
  MapPin,
  BarChart2,
  FileText,
  History,
  CreditCard,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  Home,
  TrendingUp,
  Shield,
  Menu,
  X,
} from "lucide-react";
import type { MotionStyle } from "framer-motion";
import Link from "next/link";
import { Button } from "../components/ui/Button";
import { searchAddresses, type AddressMatch } from "../lib/api";

// ---- Motion helpers ----------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger = (delay = 0.1) => ({
  show: { transition: { staggerChildren: delay } },
});

function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: MotionStyle;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 28 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.65,
            delay,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
      className={className}
      style={style as MotionStyle}
    >
      {children}
    </motion.div>
  );
}

// ---- Address search bar ------------------------------------

function AddressSearch({ onSearch }: { onSearch: (address: string) => void }) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<AddressMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputId = useId();

  useEffect(() => {
    if (value.trim().length < 5) {
      setSuggestions([]);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        setSuggestions(await searchAddresses(value));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [value]);

  function choose(addr: string) {
    setValue(addr);
    setOpen(false);
    setSuggestions([]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim().length >= 5) onSearch(value.trim());
  }

  return (
    <form onSubmit={submit} style={{ width: "100%", maxWidth: 640 }}>
      <label htmlFor={inputId} className="sr-only">
        Residential address
      </label>
      <div
        style={{
          display: "flex",
          gap: 10,
          position: "relative",
          flexWrap: "wrap",
        }}
      >
        <div className="autocomplete-wrap" style={{ flex: 1 }}>
          <input
            id={inputId}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="123 Main St, Austin, TX 78704"
            maxLength={300}
            autoComplete="street-address"
            className="field__input"
            style={{ height: 56, fontSize: 17, borderRadius: 14 }}
            aria-autocomplete="list"
            aria-controls="address-listbox"
            aria-expanded={open && suggestions.length > 0}
          />
          <AnimatePresence>
            {open && (loading || suggestions.length > 0) && (
              <motion.div
                id="address-listbox"
                role="listbox"
                className="autocomplete-list"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {loading && (
                  <div className="autocomplete-hint">
                    Finding addresses…
                  </div>
                )}
                {!loading &&
                  suggestions.map((s) => (
                    <button
                      key={`${s.provider_id}:${s.address}`}
                      type="button"
                      role="option"
                      className="autocomplete-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(s.address)}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <MapPin
                        size={14}
                        style={{ color: "var(--color-secondary)", flexShrink: 0 }}
                      />
                      {s.address}
                    </button>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={value.trim().length < 5}
          style={{ flexShrink: 0 }}
        >
          <Search size={18} aria-hidden />
          Get estimate
        </Button>
      </div>
      <p
        style={{
          marginTop: 10,
          fontSize: 13,
          color: "var(--color-secondary)",
        }}
      >
        An estimate, not an appraisal.
      </p>
    </form>
  );
}

// ---- Signature scene (SVG house + value card) ---------------

function SignatureScene() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [counted, setCounted] = useState(0);
  const target = 847500;

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCounted(target);
        clearInterval(timer);
      } else {
        setCounted(Math.round(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [inView]);

  const fmtUsd = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
        padding: "0 24px",
      }}
    >
      {/* SVG House assembly */}
      <svg
        viewBox="0 0 320 220"
        width={320}
        height={220}
        fill="none"
        aria-label="Illustration of a house"
        role="img"
        style={{ maxWidth: "100%" }}
      >
        {/* Foundation */}
        <motion.rect
          x={60} y={160} width={200} height={40} rx={4}
          fill="var(--color-divider)"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "160px 180px" }}
        />
        {/* Walls */}
        <motion.rect
          x={80} y={110} width={160} height={52} rx={2}
          fill="var(--color-surface)"
          stroke="var(--color-divider)"
          strokeWidth={1.5}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={inView ? { opacity: 1, scaleY: 1 } : { opacity: 0 }}
          transition={{ duration: 0.45, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "160px 162px" }}
        />
        {/* Door */}
        <motion.rect
          x={144} y={130} width={32} height={32} rx={3}
          fill="var(--color-blue-tint)"
          stroke="var(--color-trust)"
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.65 }}
        />
        {/* Windows */}
        <motion.rect
          x={94} y={120} width={28} height={22} rx={3}
          fill="var(--color-blue-tint)"
          stroke="var(--color-divider)"
          strokeWidth={1}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        />
        <motion.rect
          x={198} y={120} width={28} height={22} rx={3}
          fill="var(--color-blue-tint)"
          stroke="var(--color-divider)"
          strokeWidth={1}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.75 }}
        />
        {/* Roof */}
        <motion.path
          d="M 55 115 L 160 48 L 265 115 Z"
          fill="var(--color-ink)"
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Chimney */}
        <motion.rect
          x={200} y={60} width={18} height={40} rx={2}
          fill="var(--color-secondary)"
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 0.35, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "209px 100px" }}
        />
      </svg>

      {/* Value card rises */}
      <motion.div
        className="card"
        style={{
          minWidth: 280,
          maxWidth: 340,
          textAlign: "center",
          padding: "28px 32px",
          border: "1.5px solid var(--color-divider)",
          boxShadow: "var(--shadow-raised)",
        }}
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.65, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <span className="badge badge--sample">Sample</span>
          <span
            style={{ fontSize: 12, color: "var(--color-secondary)" }}
          >
            123 Fictional Ave, Austin TX
          </span>
        </div>
        <div
          className="tabular"
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: "var(--color-ink)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          {fmtUsd(counted)}
        </div>

        {/* Range bar */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              height: 6,
              background: "var(--color-divider)",
              borderRadius: 99,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                left: "15%",
                height: "100%",
                background: "var(--color-trust)",
                borderRadius: 99,
              }}
              initial={{ width: 0 }}
              animate={inView ? { width: "70%" } : { width: 0 }}
              transition={{ duration: 1.1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: 12,
              color: "var(--color-secondary)",
            }}
          >
            <span>$780K</span>
            <span style={{ color: "var(--color-trust)", fontWeight: 700 }}>
              est.
            </span>
            <span>$915K</span>
          </div>
        </div>

        <p
          style={{
            fontSize: 12,
            color: "var(--color-secondary)",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          This is a computer-generated estimate, not an appraisal, and
          cannot be used in place of one.
        </p>
      </motion.div>
    </div>
  );
}

// ---- How it works (3 steps) --------------------------------

const HOW_STEPS = [
  {
    n: "1",
    title: "Enter an address",
    body: "Type any US residential address. We use address data to find the right property record.",
    icon: MapPin,
  },
  {
    n: "2",
    title: "We analyze the property",
    body: "Our algorithm finds recent comparable sales nearby and calculates a similarity-weighted estimate.",
    icon: BarChart2,
  },
  {
    n: "3",
    title: "See the price and reasons",
    body: "You get an estimated value, a range, and the comparable sales behind it — no black box.",
    icon: TrendingUp,
  },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      style={{
        padding: "var(--section-gap) 0",
        background: "var(--color-surface)",
      }}
    >
      <div className="container">
        <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
          <h2>How it works</h2>
          <p
            style={{
              color: "var(--color-secondary)",
              marginTop: 12,
              marginInline: "auto",
            }}
          >
            Three steps to understand what a home may be worth.
          </p>
        </Reveal>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={stagger(0.15)}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {HOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                variants={fadeUp}
                className="card card--bordered"
                style={{ padding: "36px 32px" }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--color-blue-tint)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Icon size={22} color="var(--color-trust)" aria-hidden />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--color-secondary)",
                    letterSpacing: ".08em",
                    marginBottom: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Step {step.n}
                </div>
                <h3 style={{ marginBottom: 10 }}>{step.title}</h3>
                <p
                  style={{
                    color: "var(--color-secondary)",
                    fontSize: 15,
                    margin: 0,
                  }}
                >
                  {step.body}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ---- Feature bento grid ------------------------------------

const FEATURES = [
  {
    icon: BarChart2,
    title: "Price range",
    body: "See a low-to-high range, not just one number. Uncertainty is shown honestly.",
    wide: true,
  },
  {
    icon: Home,
    title: "Comparable homes",
    body: "Every estimate shows the nearby sales that drove it, with dates, prices and distance.",
  },
  {
    icon: TrendingUp,
    title: "Value factors",
    body: "Understand what pushes the estimate up or down — location, size, age and more.",
  },
  {
    icon: FileText,
    title: "Downloadable report",
    body: "Export a clean PDF with the full picture: facts, estimate, comparables, model notes.",
  },
  {
    icon: History,
    title: "Search history",
    body: "Every past search is free to reopen. See the original estimate and date, any time.",
    wide: true,
  },
  {
    icon: CreditCard,
    title: "Clear billing",
    body: "Pay per search. See exactly what you've used. No subscriptions, no surprises.",
  },
];

function FeatureGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section style={{ padding: "var(--section-gap) 0" }}>
      <div className="container">
        <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
          <h2>Everything you need to understand a price</h2>
        </Reveal>
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={stagger(0.08)}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="card card--bordered"
                style={{
                  padding: "28px 24px",
                  gridColumn: f.wide ? "span 2" : undefined,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--color-blue-tint)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} color="var(--color-trust)" aria-hidden />
                </div>
                <h3 style={{ fontSize: 17, margin: 0 }}>{f.title}</h3>
                <p
                  style={{
                    color: "var(--color-secondary)",
                    fontSize: 15,
                    margin: 0,
                  }}
                >
                  {f.body}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 768px) {
          .feature-grid > * { grid-column: span 1 !important; }
        }
      `}</style>
    </section>
  );
}

// ---- Transparency (navy) ------------------------------------

function TransparencySection() {
  return (
    <section
      style={{
        background: "var(--color-navy)",
        padding: "var(--section-gap) 0",
        color: "var(--color-on-navy)",
      }}
    >
      <div className="container">
        <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,.1)",
              borderRadius: 99,
              padding: "5px 16px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              marginBottom: 20,
              color: "var(--color-on-navy-muted)",
            }}
          >
            <Shield size={14} aria-hidden />
            Transparency
          </div>
          <h2 style={{ color: "var(--color-on-navy)", marginBottom: 16 }}>
            Honest about what we know — and what we don't
          </h2>
          <p style={{ color: "var(--color-on-navy-muted)", marginInline: "auto" }}>
            RealValue is an experimental tool, not a certified appraisal service.
          </p>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {[
            {
              title: "How confidence works",
              body: "We report Medium confidence for all current estimates because the model has not completed held-out backtesting. We will update this when results are validated.",
            },
            {
              title: "What data we use",
              body: "Provider-reported comparable sales within the past 12 months, within 10 miles, of a matching residential property type. Every source record is shown.",
            },
            {
              title: "What we can't see",
              body: "Interior condition, unreported renovations, concessions in the sale price, and unique features. These can meaningfully affect value. An appraiser sees what we cannot.",
            },
          ].map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 0.1}
              style={{
                borderTop: "1px solid rgba(255,255,255,.12)",
                paddingTop: 28,
              }}
            >
              <h3
                style={{
                  color: "var(--color-on-navy)",
                  marginBottom: 10,
                  fontSize: 18,
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  color: "var(--color-on-navy-muted)",
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Pricing -----------------------------------------------

const PRICE_PER_SEARCH = 4.0; // server setting — read from env in production

function PricingSection() {
  return (
    <section
      style={{
        padding: "var(--section-gap) 0",
        background: "var(--color-surface)",
      }}
    >
      <div className="container" style={{ maxWidth: 640, textAlign: "center" }}>
        <Reveal>
          <div className="badge badge--blue" style={{ marginBottom: 16 }}>
            Early access demo pricing
          </div>
          <h2 style={{ marginBottom: 12 }}>Simple, transparent pricing</h2>
          <p style={{ color: "var(--color-secondary)", marginInline: "auto" }}>
            Pay per search. No subscription. No commitments.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div
            className="card card--bordered"
            style={{ marginTop: 48, padding: "48px 40px", textAlign: "center" }}
          >
            <div
              className="tabular"
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: "var(--color-ink)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              ${PRICE_PER_SEARCH.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: 15,
                color: "var(--color-secondary)",
                marginTop: 6,
                marginBottom: 32,
              }}
            >
              per estimate
            </div>

            {[
              "Full report with comparable sales",
              "Free to reopen past searches",
              "PDF download included",
              "Pay only for successful estimates",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                  marginBottom: 12,
                  fontSize: 15,
                }}
              >
                <CheckCircle2
                  size={18}
                  color="var(--color-success)"
                  aria-hidden
                  style={{ flexShrink: 0 }}
                />
                {item}
              </div>
            ))}

            <div
              style={{
                marginTop: 32,
                padding: "14px 20px",
                background: "var(--color-warning-bg)",
                borderRadius: 10,
                fontSize: 13,
                color: "var(--color-warning)",
                border: "1px solid var(--color-warning-border)",
              }}
            >
              <strong>Demo mode:</strong> Billing is not yet active. Prices
              shown are planned launch pricing.
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---- FAQ accordion -----------------------------------------

const FAQ_ITEMS = [
  {
    q: "Is this an appraisal?",
    a: "No. RealValue produces a computer-generated estimate based on comparable sales data. It is not an appraisal, and it cannot be used in place of one for lending, legal, or tax purposes.",
  },
  {
    q: "How is the estimate calculated?",
    a: "We find recent closed sales of similar residential properties within 10 miles. Each is weighted by distance, living area, age, lot size, and recency. The estimate is a weighted median of those sale prices. No adjustment is invented for factors we can't observe.",
  },
  {
    q: "How accurate is it?",
    a: "We are still testing and will publish accuracy results when they are validated on held-out data. All current estimates are labeled Experimental for this reason.",
  },
  {
    q: "Who can see my searches?",
    a: "Only you. Your searches are private to your account. We do not sell or share individual search data. See our Privacy Policy for details.",
  },
  {
    q: "What data does RealValue collect?",
    a: "We collect the addresses you search, your account email, and your usage for billing purposes. We do not collect income, credit history, race, ethnicity, religion, sex, or any protected characteristic.",
  },
  {
    q: "What if the estimate seems wrong?",
    a: "Estimates can be off for many reasons — recent renovations, interior condition, off-market concessions. Use 'Report wrong home data' in the app to flag an issue, and always consult a licensed appraiser for important decisions.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ padding: "var(--section-gap) 0" }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
          <h2>Frequently asked questions</h2>
        </Reveal>
        <div>
          {FAQ_ITEMS.map((item, i) => (
            <div key={item.q} className="accordion-item">
              <button
                className="accordion-trigger"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {item.q}
                <ChevronDown size={20} aria-hidden />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <p className="accordion-panel">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Mobile nav --------------------------------------------

function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(11,31,58,.4)",
              zIndex: 199,
            }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              bottom: 0,
              width: 280,
              background: "var(--color-surface)",
              zIndex: 200,
              padding: "24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              boxShadow: "var(--shadow-dropdown)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <button
              onClick={onClose}
              style={{
                alignSelf: "flex-end",
                background: "none",
                border: "none",
                color: "var(--color-secondary)",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                padding: 8,
                borderRadius: 8,
              }}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
            {[
              { href: "#how-it-works", label: "How it works" },
              { href: "#transparency", label: "Accuracy & method" },
              { href: "#pricing", label: "Pricing" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                style={{
                  padding: "14px 12px",
                  borderRadius: 10,
                  color: "var(--color-ink)",
                  fontWeight: 500,
                  fontSize: 17,
                  textDecoration: "none",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-page)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {link.label}
              </a>
            ))}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/sign-in">
                <Button variant="secondary" fullWidth>
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="primary" fullWidth>
                  Create account
                </Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---- Main page ---------------------------------------------

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearch(address: string) {
    // Store address and redirect to sign-up (or search if logged in)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rv:pending-address", address);
      window.location.href = "/sign-up";
    }
  }

  return (
    <>
      {/* NAV */}
      <nav className="nav" aria-label="Main navigation">
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            height: "100%",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--color-ink)",
              letterSpacing: "-0.02em",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            RealValue
          </Link>

          {/* Desktop links */}
          <div
            style={{ display: "flex", gap: 8, flex: 1 }}
            className="desktop-nav-links"
          >
            {[
              { href: "#how-it-works", label: "How it works" },
              { href: "#transparency", label: "Accuracy & method" },
              { href: "#pricing", label: "Pricing" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="btn btn--ghost btn--sm"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Auth buttons */}
          <div
            style={{ display: "flex", gap: 10, flexShrink: 0 }}
            className="desktop-auth"
          >
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="primary" size="sm">
                Create account
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            style={{ background: "none", border: "none", color: "var(--color-ink)", display: "none", padding: 8 }}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* HERO */}
      <section
        style={{
          paddingTop: 100,
          paddingBottom: 80,
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 32,
          }}
        >
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger(0.12)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}
          >
            <motion.div variants={fadeUp}>
              <span className="badge badge--blue">Early access</span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              style={{ maxWidth: 820, margin: 0 }}
            >
              Know what a home is really worth.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              style={{
                fontSize: 20,
                color: "var(--color-secondary)",
                maxWidth: 520,
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              Enter an address. See an estimated value, a likely range and
              the reasons behind it.
            </motion.p>
            <motion.div variants={fadeUp} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <AddressSearch onSearch={handleSearch} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SIGNATURE SCROLL SCENE */}
      <section
        style={{
          padding: "var(--section-gap) 0",
          background: "var(--color-page)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <Reveal style={{ marginBottom: 48 }}>
            <span className="badge badge--sample" style={{ marginBottom: 16 }}>
              Sample data
            </span>
            <p
              style={{
                color: "var(--color-secondary)",
                fontSize: 15,
                marginInline: "auto",
              }}
            >
              Here&apos;s what a report looks like.
            </p>
          </Reveal>
          <SignatureScene />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* FEATURE GRID */}
      <FeatureGrid />

      {/* TRANSPARENCY */}
      <div id="transparency">
        <TransparencySection />
      </div>

      {/* PRICING */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* FAQ */}
      <FAQ />

      {/* CLOSING CTA */}
      <section
        style={{
          padding: "var(--section-gap) 0",
          background: "var(--color-blue-tint)",
          borderTop: "1px solid var(--color-divider)",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ maxWidth: 640 }}>
          <Reveal>
            <h2 style={{ marginBottom: 16 }}>
              Ready to look up your first address?
            </h2>
            <p
              style={{
                color: "var(--color-secondary)",
                marginInline: "auto",
                marginBottom: 36,
              }}
            >
              Create a free account and run your first estimate in under a
              minute.
            </p>
            <Link href="/sign-up">
              <Button size="lg">
                Create account
                <ArrowRight size={18} aria-hidden />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid var(--color-divider)",
          background: "var(--color-surface)",
          padding: "48px 0 32px",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 32,
              alignItems: "start",
              marginBottom: 32,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--color-ink)",
                  marginBottom: 8,
                  letterSpacing: "-0.02em",
                }}
              >
                RealValue
              </div>
              <p
                style={{
                  color: "var(--color-secondary)",
                  fontSize: 14,
                  margin: 0,
                  maxWidth: 360,
                }}
              >
                A transparent tool for understanding what homes may be worth.
                Not an appraisal. Not financial advice.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px 24px",
                justifyContent: "flex-end",
              }}
            >
              {[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
                { href: "/methodology", label: "Methodology" },
                { href: "mailto:hello@realvalue.app", label: "Contact" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    color: "var(--color-secondary)",
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid var(--color-divider)",
              paddingTop: 24,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "var(--color-secondary)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              This is a computer-generated estimate, not an appraisal, and
              cannot be used in place of one. RealValue is an experimental
              service. Estimates are unvalidated and subject to material
              error. Do not use this tool for lending, legal, tax, or
              investment decisions. &copy; {new Date().getFullYear()} RealValue.
            </p>
          </div>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav-links { display: none !important; }
          .desktop-auth      { display: none !important; }
          .mobile-menu-btn   { display: flex !important; margin-left: auto; }
        }
        @media (max-width: 640px) {
          .feature-grid-inner > * { grid-column: span 1 !important; }
        }
      `}</style>
    </>
  );
}
