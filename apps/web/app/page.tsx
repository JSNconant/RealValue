"use client";

import { FormEvent, useState } from "react";
import { getDemoValuation, getLiveValuation, formatUsd, type ValuationResult } from "../lib/api";

export default function Home() {
  const [address, setAddress] = useState("123 Fictional Ave, Austin, TX 78704");
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
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

  return (
    <main>
      <header className="topbar"><div className="brand">RealValue</div><p>Know what a home may be worth — and why.</p></header>
      <section className="search-wrap">
        <form onSubmit={submit} className="search">
          <label htmlFor="address">Residential address</label>
          <div className="search-row">
            <input id="address" value={address} onChange={(event) => setAddress(event.target.value)} maxLength={300} required />
            <button disabled={loading}>{loading ? "Searching…" : "Search"}</button>
            <button type="button" className="demo-button" onClick={loadDemo} disabled={loading}>Load demo</button>
          </div>
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
            <div className="status-card"><strong>Model status</strong><span>Not validated</span><small>As of {result.as_of_date}</small></div>
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
