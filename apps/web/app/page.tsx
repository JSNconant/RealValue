"use client";

import { FormEvent, useEffect, useState } from "react";
import { getDemoValuation, getLiveValuation, formatUsd, searchAddresses, type AddressMatch, type ValuationResult } from "../lib/api";

export default function Home() {
  const [address, setAddress] = useState("123 Fictional Ave, Austin, TX 78704");
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<AddressMatch[]>([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const query = address.trim();
    if (query.length < 5) {
      setSuggestions([]);
      return;
    }
    const timeoutId = window.setTimeout(async () => {
      try {
        setSuggestionLoading(true);
        const matches = await searchAddresses(query);
        setSuggestions(matches);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionLoading(false);
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [address]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setShowSuggestions(false);
    setLoading(true);
    setError("");
    try {
      setResult(await getLiveValuation(address));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to search");
    } finally {
      setLoading(false);
    }
  }

  async function loadDemo() {
    setShowSuggestions(false);
    setLoading(true);
    setError("");
    try {
      setResult(await getDemoValuation(address));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load demo");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdfReport() {
    if (!result) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxTextWidth = pageWidth - 80;
    let y = 50;

    const writeLine = (text: string, gap = 16, size = 11, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, maxTextWidth);
      doc.text(lines, 40, y);
      y += lines.length * (size + 2) + gap;
      if (y > 740) {
        doc.addPage();
        y = 50;
      }
    };

    writeLine("RealValue Report", 10, 18, true);
    writeLine(`Address: ${result.address}`, 4, 11, true);
    writeLine(`Status: ${result.estimate_status.replaceAll("_", " ")}`, 4);
    writeLine(`Estimate: ${formatUsd(result.estimate_cents)}`, 4);
    writeLine(`As of: ${result.as_of_date}`, 10);

    writeLine("Explanation", 4, 13, true);
    writeLine(result.explanation, 10);

    writeLine("Disclaimers", 4, 13, true);
    for (const disclaimer of result.disclaimers) writeLine(`• ${disclaimer}`, 2);

    writeLine("Comparable Sales", 4, 13, true);
    if (result.comparables.length === 0) {
      writeLine("No qualifying comparable sales were included.");
    } else {
      for (const comp of result.comparables) {
        writeLine(
          `• ${comp.address} | ${comp.transaction_date || "N/A"} | ${formatUsd(comp.sale_price_cents)} | ${(comp.weight * 100).toFixed(1)}%`,
          2,
        );
      }
    }

    writeLine("Warnings", 4, 13, true);
    for (const warning of result.warnings) writeLine(`• ${warning}`, 2);

    doc.save(`realvalue-report-${result.address.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
  }

  return (
    <main>
      <header className="topbar"><div className="brand">RealValue</div><p>Know what a home may be worth — and why.</p></header>
      <section className="search-wrap">
        <form onSubmit={submit} className="search">
          <label htmlFor="address">Residential address</label>
          <div className="search-row">
            <input id="address" value={address} onFocus={() => setShowSuggestions(true)} onChange={(event) => setAddress(event.target.value)} maxLength={300} required />
            <button disabled={loading}>{loading ? "Searching…" : "Search"}</button>
            <button type="button" className="demo-button" onClick={loadDemo} disabled={loading}>Load demo</button>
          </div>
          {showSuggestions && (suggestionLoading || suggestions.length > 0) && (
            <div className="suggestions-wrap">
              {suggestionLoading && <div className="suggestion-hint">Finding matching addresses…</div>}
              {!suggestionLoading && suggestions.map((item) => (
                <button
                  type="button"
                  key={`${item.provider_id ?? "unknown"}:${item.address}`}
                  className="suggestion-item"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setAddress(item.address);
                    setShowSuggestions(false);
                  }}
                >
                  {item.address}
                </button>
              ))}
            </div>
          )}
        </form>
      </section>

      {error && <section className="notice error">{error}</section>}

      {result && (
        <section className="results">
          <div className={result.disclaimers.some((item) => item.includes("DEMO") || item.includes("Fictional")) ? "demo-banner" : "status-banner"}>{result.disclaimers.some((item) => item.includes("DEMO") || item.includes("Fictional")) ? "DEMO — NOT A LIVE VALUATION" : "LIVE PROVIDER DATA — EXPERIMENTAL, NOT VALIDATED"}</div>
          <div className="hero">
            <div>
              <p className="eyebrow">{result.estimate_status.replaceAll("_", " ").toUpperCase()}</p>
              <h1>{formatUsd(result.estimate_cents)}</h1>
              <p>{result.address}</p>
            </div>
            <div className="status-card"><strong>Model status</strong><span>Not validated</span><small>As of {result.as_of_date}</small><button type="button" className="report-button" onClick={downloadPdfReport}>Download PDF report</button></div>
          </div>

          <article className="card">
            <h2>Why this value?</h2>
            <p>{result.explanation}</p>
            <div className="chips">{result.disclaimers.map((item) => <span key={item}>{item}</span>)}</div>
          </article>

          <article className="card">
            <h2>Comparable sales</h2>
            <div className="table-wrap"><table>
              <thead><tr><th>Address</th><th>Sale date</th><th>Distance</th><th>Sale price</th><th>Living area</th><th>Weight</th></tr></thead>
              <tbody>{result.comparables.map((comp) => <tr key={comp.address}><td>{comp.address}</td><td>{comp.transaction_date || "Not available"}</td><td>{comp.distance_miles == null ? "Not available" : `${comp.distance_miles.toFixed(1)} mi`}</td><td>{formatUsd(comp.sale_price_cents)}</td><td>{comp.living_area_sqft ? `${comp.living_area_sqft.toLocaleString()} sq ft` : "Not available"}</td><td>{(comp.weight * 100).toFixed(1)}%</td></tr>)}</tbody>
            </table></div>
          </article>

          <div className="grid">
            <article className="card"><h2>Model assumptions</h2><ul>{result.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></article>
            <article className="card"><h2>Warnings</h2><ul>{result.warnings.map((item) => <li key={item}>{item}</li>)}</ul></article>
          </div>

          <article className="card"><h2>Property facts</h2><dl>{Object.entries(result.property_facts).map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{String(value)}</dd></div>)}</dl></article>

          <article className="card"><h2>Sources</h2>{result.sources.map((source) => <div className="source" key={source.evidence_id}><strong>{source.provider}</strong><span>{source.field}: {source.value}</span>{source.source_url && <a href={source.source_url} target="_blank" rel="noreferrer">Provider documentation</a>}</div>)}</article>
        </section>
      )}
    </main>
  );
}
