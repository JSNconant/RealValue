# REALVALUE — MASTER RESEARCH, ALGORITHM & IMPLEMENTATION SPECIFICATION

**Version:** 1.0 — 2026-11-22  
**Status:** Prototype engineering specification and research agenda; NOT a validated valuation model  
**Intended readers:** Developer, VS Code coding assistant, Google Antigravity, data scientist, appraisal advisor  
**Deployment target:** Python API + PostgreSQL on **Railway**; Next.js UI on **Vercel**  
**Business vision:** The transparent, trusted “Kelley Blue Book of residential real estate.”

> **IMPORTANT AGENT DIRECTIVE:** Read this file fully before generating code. The highest priority is a defensible, auditable valuation engine and a real-data pipeline. A slick website is not the priority. Do NOT represent an untrained or unvalidated formula as a model accurate within 5%. Do NOT fabricate property attributes, comparables, calculations, citations, or source links. Where unavailable or insufficient data prevents a defensible estimate, return a clearly stated limitation. After generating the prototype, guide the human owner step by step through API registration, `.env` setup, local runs, deployment, CORS configuration, and live smoke tests for Railway + Vercel. Independently research and verify current provider docs, pricing, licensing and methods before implementing integrations.

---

## TABLE OF CONTENTS
1. Mission, goals, non-goals and truthfulness rules
2. What value is; valuation target; target metrics
3. Evidence from existing practice and competitors
4. Prototype product requirements and UX
5. Data acquisition, vendor evaluation and provenance
6. Canonical property and market data model
7. Rigorous valuation algorithm: comparator pipeline
8. Hedonic / machine-learning enhancement plan
9. Local macroeconomics, cost, rent, risk and avoiding double counts
10. Uncertainty and the honest confidence range
11. Explainability, citations and LLM guardrails
12. API contract, data lineage and database design
13. Implementation stack and repository organization
14. Testing, validation and model governance
15. Railway + Vercel deployment and exact ENV setup requirements
16. Security, privacy, licensing, regulatory and ethics requirements
17. Stepwise implementation schedule and acceptance criteria
18. Required independent research by coding agent
19. Handoff prompt for VS Code / Antigravity
20. References with live URLs
21. Decisions and unresolved questions

---

# 1. MISSION, GOALS AND NON-GOALS

## 1.1 Mission
Build RealValue as a credible valuation system in which a user searches a US residential street address, obtains a reasonable MARKET VALUE estimate (or an honest explanation for non-availability), sees a range with accurately represented uncertainty, reads a short plain-English explanation of WHY, and scrolls through the supporting property information, relevant transactions, adjustments, economic context and cited sources.

User vision: RealValue should eventually be the “Kelley Blue Book of real estate.” Broad geographic coverage is the ultimate aspiration. Begin technical validation in one well-defined geography/property type if data constraints require. This is NOT a restriction on the ultimate website experience.

## 1.2 Priorities, ordered
1. Valuation accuracy, statistical honesty, defensible methodology.
2. Correct data, provenance, source links, licensing and freshness.
3. Transparent, reproducible calculation and quality/error handling.
4. Independent validation of the claimed range and the long-term within-5% target.
5. Clear AI-assisted explanation limited to computed, cited evidence.
6. Rich scrollable property detail.
7. Reliable API and deployment.
8. A minimal, functional UI (not visual polish).

## 1.3 What users will be able to do
- Type an address; select a resolved match, where necessary.
- View verified property identity and attributes; conflicting items flagged.
- View raw and adjusted comparable sales and why each was used/excluded.
- See a point estimate, uncertainty interval (only if calibrated), valuation date, data recency, and model version.
- Read a ~100–180 word cited summary that references actual facts.
- Scroll through recorded area, beds/baths, lot, age, sales/tax history, neighborhood market conditions, risks, and source table when data rights permit.
- Understand caveats, such as unknown renovation condition or low-comparable coverage.
- Optional development-only comparison to third-party AVM benchmarks, with license-compliant attribution, not mislabeled as a proprietary model.

## 1.4 Non-goals for prototype
- Do not promise valuation within 5%, a fixed ±5% price band, appraisal equivalence or underwriting suitability.
- Do not scrape sites without permission, bypass paywalls, expose data-provider secrets or fabricate an MLS connection.
- Do not build authentication, subscriptions, full nationwide training, mortgage decisions or legal-opinion products unless justified by prototype needs.
- Do not let an LLM generate a sale price from prose alone or make up adjustments.
- Do not add dozens of weak data signals only because they sound sophisticated.
- Do not build a bogus “confidence score 98%” based on subjective heuristics.

## 1.5 Key distinction
An observed sale price is a transaction outcome, not necessarily the unique true value. A $600k predicted price that later sells for $630k has 4.76% absolute percentage error versus the realized sale, but a transaction may reflect bargaining, concessions or special terms. Our test outcome should be arm's-length, cash-equivalent transaction price wherever feasible. This limitation must appear in model documentation.

---

# 2. DEFINE THE ESTIMAND AND ACCURACY TARGET

## 2.1 Primary estimand
**As-of-date market value**: estimated cash-equivalent price a qualifying residential property would most likely command on date t, with normal exposure, informed and typically motivated market participants, and ordinary terms. The technical implementation predicts the eventual *arm's-length close price*, with data frozen as of the prediction date and a defined evaluation horizon. This is a proposed product definition, not a statutory legal appraisal definition.

Keep separate:
- `market_value`: likely exchange price in current market;
- `listing_price`: seller's ask, not ground truth;
- `sale_price`: actual transaction outcome, possibly with atypical terms;
- `investment_value`: investor-specific discounted cash flow or required return;
- `replacement_cost`: cost of improvements + land, adjusted for depreciation;
- `assessment_value`: tax/assessment datum, not necessarily current market value.

## 2.2 Prediction event and horizon
Define before evaluation: e.g. valuation at a timestamp just before a listing appears, outcome the first qualifying transaction closing within 90–180 days. Analyze separately: on-market (listing accessible at prediction time); truly off-market (no listing information). Do not compare these cohorts or provider accuracy figures as if equivalent. Only predict for property types within training/test support.

## 2.3 Essential metrics
For qualifying property i: `APE_i = 100 * abs(pred_i - sale_i) / sale_i`. Report at minimum:
- median APE (MdAPE), mean APE (MAPE) plus caution about tail sensitivity;
- percent within 5%, within 10%; P75, P90, P95 APE;
- signed percent error / calibration / over- versus underpricing;
- subgroup error by geography, price band, property type, age and data quality;
- **coverage**: percent of all eligible homes receiving usable estimates, and the error rate for excluded/abstained populations where assessable;
- reported interval coverage and median interval width on truly held-out future outcomes;
- confidence intervals for these evaluation metrics (bootstrap by appropriate time/geographic clusters);
- engineering metrics: latency, API cost per lookup, missing-data rate and source link success.

The **aspirational benchmark** to test, not claim: median APE ≤5%; ≥70% of independently held-out qualifying transactions within 5%; calibrated 90% predictive interval coverage ~90%; explainable outputs. These thresholds are suggested gates, not proven deliverables. A median APE of 5% implies about half, NOT 70%, are within 5%. The interval may be broader than ±5%.

## 2.4 Professional acceptance
Optional blind expert review: appraisers and experienced brokers independently value a held-out sample before seeing RealValue. Grade comparables, adjustments, reasoning, data accuracy, and reasonableness. Attorneys may review legal defensibility, not substitute for licensed appraisers in technical valuation scoring. Do not optimize for subjective consensus at the expense of verified future sale accuracy.

---

# 3. INDUSTRY CONTEXT AND EMPIRICAL EVIDENCE

## 3.1 Core approaches
**Sales comparison**: select competitive recently sold homes and adjust for material differences in time, location, physical characteristics, concessions and condition. This is the primary prototype method. Fannie Mae emphasizes that adjustments must be market-supported, not based on arbitrary dollar amounts or rigid gross/net limits. [R1][R2]

**Cost approach**: land plus current replacement cost less relevant depreciation/obsolescence; useful sanity check for new/unusual homes, not a universal price floor.

**Income approach**: market rent and NOI/cap rates or discounted cash flow; useful for investment property, not necessarily a decisive owner-occupied detached-house model.

**Agent CMA**: professional selection and analysis of comps, listings, condition and market trends; more nuanced than merely copying prior purchase prices. Interviews are needed to quantify specific pain points.

**Automated valuation models**: hedonics, repeat-sales models, ensembles and other proprietary methods. Some incumbent systems already use extensive property and market information. Do NOT imply competitors omit all macro factors.

## 3.2 Verified noteworthy findings
- FHFA found market-condition/time adjustments systematically underused in sampled appraisals: ~13% of comparables actually adjusted versus an estimated ~64% that warranted adjustments under its method; findings are for its analyzed period/sample, NOT proof of current universal under-adjustment. [R3]
- As of the Zillow accuracy page retrieved November 2026, provider-reported nationwide median error: approximately 1.80% on-market, 7.21% off-market. Comparisons require like-for-like sampling, dates and methods. [R4]
- Fannie Mae's March 2026 guidance again emphasizes market changes between comparable contract date and appraisal effective date. [R5]
- RentCast currently documents property records, sale history, AVM/comps and market data. It can bootstrap an API prototype, but license and contract must be checked for storage, public display, derived works and commercial use. [R6][R7]
- RESO is a DATA STANDARD, not a free MLS data source. Credentials/licensing must be negotiated with actual providers. [R8]
- Specific mortgage-use AVM quality-control regulations became effective October 1, 2025; applicability depends on entity and use. Do not claim a consumer prototype is categorically governed by those exact rules. [R9]

## 3.3 Opportunity hypotheses (UNPROVEN)
1. Better timestamped property condition records improve off-market accuracy.
2. Smarter as-of-date time adjustments improve performance during market changes.
3. Proper micro-market segmentation and local calibration outperform broad averages in selected markets.
4. Source-linked comparisons and transparent confidence may command greater professional trust.
5. An explicit abstention policy improves quality of published predictions.

Do not turn hypotheses into marketing claims before ablation tests.

---

# 4. PROTOTYPE PRODUCT / SIMPLE UI

## 4.1 Main screen (minimal)
- Header: RealValue wordmark and one-line description “Know what a home is worth — and why.”
- Address autocomplete / input, search button, clear loading/error states.
- Optional “Demo example” using clearly fictional fixtures and banner “DEMO — NOT A LIVE VALUATION.”
- Small disclaimer: experimental estimates, not appraisals.

## 4.2 Property result, order
1. Canonical address, basic snapshot, last refresh, property photo ONLY if licensed, otherwise neutral placeholder.
2. Estimated price and range; `MODEL NOT VALIDATED` or `EXPERIMENTAL` status prominently until evaluation gates met; model / date / geography scope. If no defensible estimate: “Insufficient evidence to value reliably” + reasons; still show property facts.
3. “Why this value?” 3–5 grounded sentences, inline `[1]` citation labels linking to Sources.
4. Comparables interactive table: address (only when license permits), distance, contract/close dates, recorded price, acreage/living area, bed/baths, adjustments, adjusted price, weight, source link, reason selected. Excluded comps optionally accessible.
5. Valuation calculation details, locally estimated changes over time, caveats, contributing predictors and source quality.
6. Expandable sections: Property attributes, sale/assessment history, local market trends, financing/macro context, hazards/ownership costs (only if data retrieved), source/evidence log.
7. Methodology and error metrics specific to coverage cohort (not inflated national promise).

## 4.3 UX constraints
- Mobile responsive, keyboard accessible, no animations needed.
- Never make clickable controls that do nothing; if data missing, show “Not available” instead of blank or zero.
- Prices USD, living area sq.ft., date and units clearly identified.
- Citations in summaries correspond to actual persisted evidence entries with provenance and timestamps.
- Visually distinguish observed raw facts, derived features, predictions and assumptions.
- Never present an illustrative screenshot/property as an actual home.

---

# 5. DATA VENDORS, API STRATEGY AND PROVENANCE

## 5.1 Startup data strategy
**Preferred FIRST integration to investigate:** RentCast property records and sold comps with account key; verify live endpoint shapes, coverage, limits, unit costs, licensing and allowable public presentation. Alternative/comparison: ATTOM. For MVP, one functioning provider is better than six mock providers. Build a `PropertyProvider` abstraction to switch or enrich later.

Potential inputs:
- RentCast property / sale records and comparator listings [R6][R7].
- ATTOM property, sale history, sales comparables [R10].
- Licensed MLS through a provider (RESO Web API standard) [R8].
- FHFA repeat-sales HPI, local trend caveats [R11].
- Freddie Mac / FRED historical mortgage rates and broader economics [R12].
- Census / BLS labor, population, income series if applicable.
- FEMA NFHL flood maps / USGS elevation, local county GIS when useful and licensed.

## 5.2 Research BEFORE writing actual provider adapters
The coding agent MUST inspect CURRENT official docs and explicitly record:
- API base URLs, exact path/verb, query schema, authentication header, pagination, errors, quotas, and data types.
- Which raw fields represent **assessor**, **listing**, **deed**, **AVM** or **derived** information.
- Whether the sold date is **contract date**, **closing date**, or **recording date**; don't substitute one silently.
- Whether comps return actual closed deals vs listings, the difference between sale amount and list price, and available seller concessions.
- Licensing for storing responses, publishing full addresses, photos, owner name, valuation derivatives, public source URLs and redistributing raw records.
- Query geography, property type coverage and local completeness.
- Whether market data is ZIP-level, city-level, county-level or metropolitan; never imply block-level precision from ZIP data.
- Usage cost at 100, 1,000 and 10,000 searches / month; graceful usage caps.

## 5.3 Data classification
Every value must carry:
`field_name, value, unit, provider, provider_record_id, source_url (optional), retrieved_at, observed_at / effective_at, source_record_date (if known), license_context, confidence_status, raw_payload_reference`.

`confidence_status` examples: `verified_public_record`, `provider_reported`, `user_supplied_unverified`, `model_inferred`, `conflicted`, `missing`.

**NEVER invent a direct source URL.** If an API gives only a record ID, display provider name + record ID and a general documentation link explicitly labeled as documentation, not as an original property-record citation.

If providers disagree on living area, preserve both source records. Select canonical value according to documented precedence/data-quality policy, show ambiguity and measure valuation sensitivity.

## 5.4 Address resolution
- Normalize parsed street/city/state/ZIP; avoid treating fuzzy match as certainty.
- Disambiguate condos/unit numbers; distinguish parcel vs street address, multi-building parcels, duplexes and ADUs.
- Store canonical geocoordinates, parcel ID when legal to retain, provider ID, normalized address; dedupe cautiously.
- Guard against input injection and malicious address strings.
- Only supported US residential property types initially; return `unsupported_property_type` otherwise.

## 5.5 Caching, freshness and cost
- Cache non-sensitive permitted API responses and normalized facts subject to license.
- Provider-defined TTL by category (transaction facts relatively stable; active listings/market metrics more volatile).
- Record `retrieved_at` and temporal validity; separate “last verified” from when the real-world event occurred.
- Bounded retries with jitter, request timeouts, circuit breakers, per-key quotas and rate limiting.
- Partial result if one API is down; never silently swap in fake data.
- Remove/limit personally identifiable owner data from consumer UI even if an API provides it.

---

# 6. CANONICAL PROPERTY DATA MODEL

Entity groups:
- `Property`: internal id, normalized address, geography, parcel identifier, `property_type`, living_area_sqft, lot_area_sqft, beds, full_baths, half_baths, year_built, effective_age, stories, garage, basement, quality, condition (with source), unit, geocoordinates, record timestamps.
- `SourceRecord`: provider, record ID, type, sourceURL?, retrievedAt, observedAt, payloadHash, licenseFlags, field-level provenance.
- `Transaction`: property id, price, contractDate?, closeDate?, recordingDate?, armLengthStatus, concessions?, cashEquivalentPrice?, verifiedSaleFlag, sourceRecord.
- `Listing`: original and current ask, status history, price cuts, snapshot timestamps, listing/contract dates, source rights.
- `MarketSeries`: geographyLevel, geographyID, metric, observationDate, firstPublishedAt / revisionAt, numericValue, unit, provider.
- `PropertyConditionObservation`: roof, HVAC, kitchen, bathrooms, renovations, permits, image provenance, claimed vs verified, date.
- `ComparableCandidate`: reference property id, eligibility, score, exclusion reasons, dimensions, raw transaction, adjustments, adjustedPrice, learnedWeight, usedFlag.
- `ValuationRun`: property, asOf, targetOutcomeHorizon, modelVersion, algorithmConfigVersion, inputSnapshotHash, estimate, interval?, intervalCoverageTarget?, outputStatus, qualityFlags, featureSnapshot, rawComps, adjustedComps, evidenceIDs, createdAt.
- `Evidence`: claimId, field, specific raw/derived value, provider, recordId, observedAt, retrievedAt, sourceUrl?, transforms, linked valuation run.
- `BacktestRun`: datasetVersion, freezeDate, splits, metrics, calibration, subgroup analyses, exclusions, artifacts, codeVersion.

Use Postgres (SQLAlchemy + Alembic), typed Pydantic contracts. Never overwrite historical facts without lineage. Ingest raw payloads into a controlled storage/caching layer subject to licensing and privacy, while preserving hashes for reproducibility. Store money as integer cents or decimal, never binary floats for dollar accounting. Spatial indexing optional future/PostGIS. Financial modeling can use floating-point internally for statistical estimation, then deterministic rounding at output.

---

# 7. ALGORITHM V1 — RESEARCH-GROUNDED COMPARABLE SALES

This section describes a strong FIRST algorithmic scaffold. **No empirically learned coefficients are supplied yet**. The developer must IMPLEMENT actual fitting on training data or an explicitly labeled nonvalidated fallback, and must not invent universal “+ $15,000 bathroom” adjustments. If licensed transaction data is too sparse for testing, build the complete pipeline with demos/tests and mark actual live estimates as preliminary or unavailable.

## 7.1 High-level mathematical target
For subject s on as-of date t with qualifying comps j:

`adjusted_j(t) = cash_equivalent_sale_j * time_factor(j,t) + location_adjustment(j,s,t) + structural_adjustment(j,s,t) + condition_adjustment(j,s,t) + terms_adjustment(j,s,t)`

Adjustments in this additive representation have consistent money units; alternatively choose a **log-price model**:

`log(V_s,t) ≈ log(P_j) + [g(x_s,t) - g(x_j,t_j)]`

Here `g` is a fitted, regularized, market-specific hedonic function; model comparison MUST use consistent valuation dates and avoid double counting. The log formulation usually keeps modeled prices positive and makes differences approximately multiplicative, but must address retransformation bias when estimating dollar prices. Select one coherent primary specification and test it rather than combining incompatible heuristics.

Then `V_hat = robust_weighted_aggregate(adjusted_1..adjusted_K, learned_weights)` with quality-aware weights; validate weighted median, trimmed mean, robust M-estimation and supervised stacking rather than assuming any is optimal.

**Do not add time adjustments twice**: if `g` conditions on time and local market state already, calculate the change jointly, not on top of another overlapping HPI increase. Reconcile all adjustment terms into one accounting ledger.

## 7.2 Data eligibility for comparable transactions
- Observed completed arm's-length sale, not mere ask; flag foreclosures, related-party transfers, unusual concessions, bulk deals, partial interests, new-build incentives, nonmarket transfers.
- Match appropriate property class (detached SFH vs townhouse vs condo; separate strata).
- Ensure subject and comp's living area/bed/bath/lot facts were valid **as of relevant historical dates**.
- Require recorded positive sale amount, geographic confidence, reasonable data completeness, valid dates.
- Prefer sale contract date for time adjustment if available; if only closing/recording is available, mark and handle appropriately rather than asserting contract date.
- Do not use a transaction that happened after the valuation date t in prediction features.
- Sale concessions should be adjusted according to evidence of their effect on sale price, not subtracted dollar-for-dollar automatically. [R1]

## 7.3 Candidate discovery and adaptive geography/time
Start with a narrow same-property-type search. Widen *adaptively only as needed* by competitive submarket and temporal window; avoid simply expanding radius across a freeway, school boundary or dissimilar neighborhood. Define explicit configurable search policy and record each expansion. Subject-specific edge cases may require expert review.

Hard filters should not be arbitrary universal square-footage bands or magic radius; choose based on pilot data and evaluate effect on sample coverage and error. Include location distance, comp age, living area ratio, lot area, property condition and local market boundaries in ranked features.

Return `candidate_count`, `eligible_count`, chosen set and `excluded_count` + detailed reasons. If adequate support is absent, flag `thin_market`, increase interval or abstain.

## 7.4 Learned comparable similarity / ranking
Create interpretable features:
- distance in meters and whether same relevant submarket;
- time elapsed between comp contract and valuation date;
- absolute/log difference in living and lot areas;
- beds, baths, age, style, quality, condition, parking, basement;
- categorical property type and school-service boundaries only when lawful, useful and robust;
- source quality flags and missing data.

Possible baseline score:
`distance_score = sum_k alpha_k * standardized_difference_k`, where `alpha_k` is tuned on TRAINING DATA only. For geographic distances, avoid assuming straight-line distance equals economic substitutability. Better: rank using supervised pairwise relevance / learned weights and evaluate comp choices through downstream prediction error.

**Do not hardcode pseudo-scientific score factors** such as “bedroom diff*10, distance miles*4” with no empirical support. A simple documented fallback ranking is acceptable for inspection/testing, but its outputs must be tagged unvalidated.

## 7.5 Time adjustment — absolutely critical
Goal: transform comp's sale-time price to subject valuation date, conditioning on local segment price movement.

If a trustworthy log price index `h(g,t)` exists:
`P_j_at_t = P_j * exp(h(local_segment,t) - h(local_segment,t_j))`.

`h` may be estimated via:
1. quality-filtered local repeat-sales / hedonic time fixed effects;
2. broader FHFA HPI at supported geography as a regularized prior, not a fabricated micro-market HPI;
3. partial pooling of small local series toward metro/county time trends;
4. uncertainty inflation when local transaction sample is small or stale.

Beware FHFA published/revised series and publication lag: at historical test date t use only the vintage then available, not today's revised index. FHFA housing indices do not describe one house's condition or all property segments. Rate/inventory context must not be applied as a second “macro adjustment” if it is already reflected in time trend.

Test a no-time-adjustment baseline vs this model, particularly in rising/falling markets and different market speeds.

## 7.6 Structural/location adjustment
Estimate marginal effects statistically, ideally with local regularized hedonic regressions or tree models, using arm's-length training data. In a log-linear model, examples of learned terms could include `beta_log_area*log(area)`, bed/bath effects, quality, location cells/spatial smooths, lot size with diminishing returns and interaction terms. Market-supported coefficient estimates must vary by relevant geography/segment where enough data supports variation.

- Avoid simplistic price-per-square-foot multiplied by raw difference: price/sq.ft. is not generally a constant marginal value.
- Model effective age and renovation separately where reliable; do not assume year-built alone equals condition.
- Use parcel geometry/constraints only if credible.
- Use causal language cautiously: regression effect ≠ proven causal value premium.
- Use regularization, winsorization/robust likelihood and feature importance stability studies.
- For missing condition, model absence explicitly and widen uncertainty; don't assume pristine condition.

## 7.7 Price reconciliation
Store per comp:
`comp_price`, `transaction_terms_delta`, `time_delta`, `property_delta`, `location_delta`, `adjusted_price`, `weight`, `evidence_refs`, `uncertainty_flags`.

Compute aggregate robustly; check high-leverage and near-duplicate comps, correlated transactions, price outliers, spatial concentration. Weighting formulas and thresholds must be trained/validated or plainly labeled development defaults. Return `min/max/dispersion of adjusted comps` separately from **calibrated predictive interval**.

Avoid a false claim such as “$600k to $650k is our 90% confidence interval” solely because selected adjusted comps fall in that band. The distribution of comps is not a calibrated predictive interval.

## 7.8 Practical V1 fallback if there is NOT enough training data
A *transparent experimental comp-derived indicator* may be provided only when:
- real sold comps exist;
- the model shows selected raw comps and assumptions;
- coarse segment HPI time adjustment is sourced and known;
- unsupported structural adjustments are NOT fabricated;
- the result is labeled `UNVALIDATED INDICATIVE COMPARABLE RANGE`, NOT a validated RealValue market valuation;
- no deceptive “±5% certainty” is asserted;
- if comps are poor, return insufficient evidence.

Preferred for launch: gather data + run a baseline model fitted from eligible historical transactions before turning on a numeric `realvalue_estimate` for the public. The app must support a demonstration in fixture mode for developer usability without misleading users.

## 7.9 Underlying model outputs
- `estimate_usd` nullable
- `estimate_status`: `validated_market_value` (only after gates), `experimental_market_indicator`, `insufficient_evidence`, `unsupported_property`, `provider_unavailable`
- `as_of_date`, `expected_sale_horizon`, `model_version`, `data_snapshot_version`
- `valuation_interval_low/high` nullable and `interval_definition` with method/empirical coverage
- `adjusted_comps[]`, `excluded_comps[]`, `feature_contributions[]`
- `assumptions[]`, `warnings[]`, `sources[]`
- `model_health`: research flags, no invented confidence percentage.

---

# 8. MACHINE LEARNING — NEXT ITERATION, NOT A MAGIC BLACK BOX

## 8.1 Dataset and target design
Create a chronologically versioned supervised dataset. Unit: a property/prediction event at date t. Features from strictly <=t; target a future qualifying transaction within explicit horizon, conditional on sale occurrence. This introduces **selection bias** (homes that sell are not representative of all homes). Analyze selection and generalization; avoid claiming estimated accuracy for never-sold homes without qualification.

Use no leaked future listing/sale fields, no updated physical characteristics collected after cutoff, no provider AVM score that itself uses future data. For off-market evaluation, listing price / listing days / future status prohibited.

## 8.2 Models to compare
1. Robust local comps baseline.
2. Regularized log-price hedonic model with geographic/time effects.
3. Gradient boosted tabular regressor (CatBoost/LightGBM/XGBoost) with fit/predict pipelines.
4. Spatial/temporal hierarchical models or geographically regularized market effects (research).
5. Ensemble/stacking ONLY after out-of-fold train predictions; avoid using test set for weighting.

Compare on identical temporal and geographic cohorts, with cost/latency/interpretability tradeoffs. Track conditional error, not just aggregate MdAPE.

## 8.3 Time/geography splits
Train on older closed deals; tune on later validation period; test on most recent fully matured, unseen time window. Add geo holdouts to assess transfer; group repeated observations for one property to avoid duplication leakage. Use rolling backtests across multiple up/down market periods. Test geographic generalization separately from in-market accuracy.

## 8.4 Fairness, stability and drift
Assess geographic, price, condition, age, data coverage and appropriate protected-class fairness where permitted/legal. Avoid using protected class as a valuation input or silently constructing direct proxies. Monitor market shifts, provider schema drift, macro release revisions, model feature distribution changes, and comp quality. Have rollback/kill switch.

## 8.5 No automatic truth from LLMs
Language models cannot invent model coefficients. Coding agent must never say “trained on millions of properties” without a real dataset, training artifact, evaluation log and exact versioned result. If not trained, ship a transparent prototype, not a fake ML model.

---

# 9. MACRO, FUNDAMENTALS AND RISK

## 9.1 Interest rates and macro
Potential variables: mortgage rates, yield curve, local employment/unemployment, household income, inflation, construction pipeline, permits, housing inventory, price reductions, pending/closed ratio, rent levels, insurance costs, local migration and affordability. Their effect varies by geography, timing and market segment. Macro covariates can help a dynamic model but should not be blindly added as dollar adjustments on top of comp prices that already embed conditions.

**Required ablation:** Compare `comps-only`, `+time trend`, `+local inventory`, `+rates/macro`, `+risk`; keep only what improves unseen-data performance. Use published-vintage series and correct geographic mapping. Identify collinearity and endogeneity; no universal “1% higher mortgage rate means -X% house price” rule.

## 9.2 Risk and costs
Insurance, property tax, HOA dues, flood, fire, structural defects, unpermitted additions, noise and contamination can influence buyer utility and price. Only use risk fields with credible spatial resolution and publication date. Avoid double counting an observable risk discount already absorbed into comparable sale prices. Keep an optional **ownership cost / investment scenario** separate from immediate market-value result.

## 9.3 Income and cost cross checks
When allowed by data and property class, show a rental yield/NOI or replacement-cost indicator as supplemental, not automatically average it with sales comps. For thin-data classes, human appraisal expertise is necessary. Formulas:
`NOI = effective_gross_income - operating_expenses` (exclude financing and taxes on income; be consistent);
`income_indicated_value = NOI / market_supported_cap_rate`;
`cost_indicated_value = land_value + replacement_cost_new - depreciation/obsolescence`.
All parameters need real source evidence; these checks can be omitted in prototype.

---

# 10. UNCERTAINTY, RANGE, COVERAGE AND ABSTENTION

## 10.1 Explicitly separate three ranges
1. `adjusted_comps_spread`: distribution/dispersion of selected comps; descriptive, NOT calibrated.
2. `predictive_interval`: interval for **future realized sale price** for a stated horizon and cohort, empirically calibrated (ideally on held-out time segment).
3. `scenario_range`: hypothetical outcomes after changing input assumptions, NOT a statistical confidence interval.

Never label all three “confidence range.”

## 10.2 Candidate calibration approach
Train baseline model on TRAIN, tune on VAL, then calibrate residual quantiles on an independent CALIBRATION segment (or appropriate conformal approach with careful handling of temporal dependence). For heteroskedasticity estimate conditional residual scale by geography/price/condition, then calibrate scaled residuals. Assess coverage on TEST and by subgroups. Standard exchangeability assumptions may fail under time drift: evaluate rolling recalibration and re-check coverage each release. Small sample ⇒ wider intervals or abstain.

Pseudocode:
```
residual_i = abs(y_i - model.predict(X_i)) / max(scale(X_i), epsilon)
q = finite_sample_quantile(residuals_calibration, coverage=0.90)
interval(x) = [max(0, pred(x)-q*scale(x)), pred(x)+q*scale(x)]
```
This is a design outline, not proof of coverage. Statistical method and tail formulation must be validated; include treatment of asymmetric price errors where appropriate.

## 10.3 Insufficient evidence policies
Abstain or degrade to educational comp summary for unmatched address; missing parcel/unit; unsupported property type; no genuine sold comps; stale/contradictory essential fields; extreme out-of-distribution values; high leverage/outliers; unreliable market adjustment; missing necessary training support. Provide reason codes; never silently return null as $0 or generate precise fake fallback price.

## 10.4 Product reporting
If future empirical test shows, for example, 88% interval coverage for nominal 90%, label explicitly and recalibrate. Public explanation should say “Historical model intervals of this type contained approximately X% of qualifying future sales in the tested cohort” rather than “90% certain of the home's intrinsic true value.”

---

# 11. EVIDENCE-BASED EXPLANATIONS, CITATIONS AND LINKS

## 11.1 Rule: model computes, LLM explains
Never call an LLM to price a home directly. Backend calculates `ValuationRun`, produces a structured **evidence packet** of verified facts, derived comp adjustments and source records. The explanation generator receives only that packet. A deterministic template explanation MUST work without any AI API key. An optional LLM rephrasing feature may be added later.

## 11.2 Example typed evidence packet (illustrative schema, values deliberately omitted)
```
{
  "run_id": "uuid",
  "estimate": {"status":"experimental_market_indicator", "usd":null,
    "interval":null, "as_of_date":"YYYY-MM-DD", "model_version":"..."},
  "subject": {"address":"...", "facts":[{"name":"living_area_sqft", "value":null, "evidence_ids":["E001"]}]},
  "comparables": [{"id":"C1", "sale_price":null, "adjustments":[], "evidence_ids":["E002"]}],
  "market_context":[],
  "warnings":[],
  "sources":[{"evidence_id":"E001", "provider":"...", "record_id":"...",
      "source_url":null, "retrieved_at":"...", "observed_at":null}]
}
```

## 11.3 Explanation rules
- Every significant factual statement is linked to evidence IDs, rendered as clickable numbered footnotes where source URL exists.
- Include source provider and source timestamp; distinguish “public property record” vs “third-party API snapshot” vs “model calculation.”
- Calculation-derived sentences link to valuation run / comp ledger as a first-party internal calculation, plus evidence for inputs.
- Never cite an API documentation homepage as if it were a property deed; explicitly say “Provider record ID only; no public record URL supplied.”
- If missing data means the model couldn't know interior condition, say so.
- No invented comparables, market direction, percentage uplift, renovation or causal explanation.
- If LLM response contains unrecognized facts, numerical mismatches, nonexistent evidence IDs/URLs or unsupported claims, reject it and serve deterministic template.
- Protect against prompt-injection text returned by listing descriptions/provider fields.
- Show `generated_by: deterministic_template | language_model`, optional provider/version, explanation date.

## 11.4 Suggested deterministic template structure
“RealValue's [status] indication for [address] as of [date] is [estimate] [and predictive interval if valid]. The analysis used [N] qualifying closed comparables sold from [earliest] to [latest], adjusted using [actual validated adjustment methods] [with links]. The largest documented influences were [supported top terms]. [Key uncertainty]. See the transaction and adjustment ledger below.”

If not validated: “This figure has NOT been demonstrated to meet a 5% accuracy benchmark.” When no estimate, say why and still display source-backed facts.

---

# 12. BACKEND API, DATABASE AND JOBS

## 12.1 Suggested endpoints
- `GET /healthz` — no external dependencies; 200 if process live.
- `GET /readyz` — optional DB readiness.
- `GET /api/v1/address/search?q=...` — normalized suggestions / disambiguation, provider licensing permitting.
- `POST /api/v1/valuations` with `{ "address": "...", "as_of_date": "...optional..." }`; idempotency key or request ID; returns status/run ID. If synchronous response within acceptable time, body may include full result. For longer requests, 202 + polling.
- `GET /api/v1/valuations/{run_id}` — model output incl. source IDs and disclaimer.
- `GET /api/v1/properties/{id}` — normalized facts and provenance.
- `GET /api/v1/valuations/{id}/evidence` — full evidence ledger, display filtered for licensing/privacy.
- `GET /api/v1/methodology` — model version and eligible cohorts.
- Admin-only `/api/v1/dev/model/metrics` — published verified evaluation results; no fake metrics.

Use schemas; errors `{code,message,request_id,details}` and correct HTTP statuses (400 bad address, 404 not found, 409 ambiguous, 422 unsupported, 429 quota, 503 provider unavailable, 200 insufficient evidence with explicit status if property found). Avoid leaking API errors/secrets.

## 12.2 Data lineage / audit
Every valuation run stores:
- model git SHA and model artifact hash;
- source provider response ids and timestamps;
- feature version and input snapshot hash;
- comp ranking, exclusion causes, adjustments and weights;
- interval calibration metadata;
- explanation and references;
- execution warnings and missingness summary.

## 12.3 Jobs and model artifacts
Small prototype can run synchronous requests with capped latency and caching. If long queries, use database-backed jobs / lightweight task queue, timeouts and polling (do not depend on in-process memory for jobs across Railway deploys). If ML artifacts created offline, version them and load deterministically. No model training on request path.

---

# 13. TECHNOLOGY AND REPOSITORY

## 13.1 Recommended stack
- `apps/web`: **Next.js (App Router), TypeScript**, React; minimal accessible UI; deploy **Vercel**.
- `apps/api`: **Python 3.12+**, **FastAPI**, Pydantic, SQLAlchemy, Alembic, HTTPX; deploy **Railway**. Choose current stable/pinned versions during implementation.
- `PostgreSQL`: **Railway** managed Postgres for normalized records, provenance, cache metadata and audit.
- `packages/contracts` optional: OpenAPI-generated TypeScript types or shared schema tooling.
- `tests`: Python pytest and lightweight UI tests (Playwright optional).
- Git/GitHub version control; one monorepo with independent service roots is fine.
- Static charts/tables first; no need to build maps or paid UI integrations for phase 0.

## 13.2 Suggested tree
```
realvalue/
  README.md
  REALVALUE_MASTER_BUILD_AND_VALUATION_SPEC.md
  .gitignore
  apps/
    api/
      pyproject.toml
      Dockerfile   # optional, if reliable Railpack config insufficient
      .env.example
      app/
        main.py
        config.py
        api/routes/
        providers/     # rentcast.py, attom.py(optional), mock.py
        models/        # DB and Pydantic
        services/      # address, normalization, comps, valuation, evidence, explanation
        valuation/     # selection, adjustments, aggregation, uncertainty
        db/
      alembic/
      tests/
    web/
      package.json
      .env.example
      app/
      components/
      lib/api.ts
      tests/
  docs/
    ALGORITHM.md
    DATA_SOURCES.md
    RESEARCH_LOG.md
    MODEL_CARD.md
    VALIDATION_PLAN.md
    ENVIRONMENT_VARIABLES.md
    DEPLOY_RAILWAY_VERCEL.md
    DEPLOYMENT_HANDOFF.md
    API_CONTRACT.md
    DECISIONS.md
  fixtures/  # fictional/test property records clearly marked
```

Provider-agnostic interfaces and pure valuation functions are important. Tests should run without paid API credentials using clearly fictional fixture data; integration tests with real providers are opt-in and quota aware.

---

# 14. TESTING, VALIDATION, MONITORING

## 14.1 Unit tests (must include)
- Input normalization and address disambiguation.
- Unit conversion and date parsing.
- API response schema, timeouts, 401/403, 429 and missing field states.
- No future-dated comparables or future-revised indicators in historical mode.
- Non-arm's-length / mismatched type exclusions.
- Local market time factor direction: rising market forward factor >1, falling <1; zero elapsed time factor 1.
- Adjustment ledger sums/transform reconciles with comp adjusted price.
- Price arithmetic and stable deterministic aggregation.
- Missing condition → caveat, not fabricated renovated value.
- Duplicate comp/transaction de-duplication.
- No source URL fabrication; citation IDs resolve.
- LLM returned unsupported number → rejection/template fallback.
- CORS behavior with configured origin, disallow arbitrary wildcard with credentials.
- API refuses to claim validated 5% before acceptance flag and documented metrics.
- Developer fixture outputs explicitly marked demo.

## 14.2 Statistical test plan
- Rolling temporal holdouts + one final untouched future holdout.
- Spatial/price subgroup metrics and coverage; sample sizes with each metric.
- Confidence intervals around differences between models; avoid declaring winning models on tiny samples.
- Separate off-market and on-market evaluation and price horizons.
- Stratify by property type, price quintile, transaction density, age, condition-data missingness, region.
- Ablation for time, macro, condition, location data and ML ensemble.
- Assess benchmark providers only with comparable cutoffs and compliant snapshot access.
- Required deliverable `docs/MODEL_CARD.md` with data source and eligibility, target event, training cutoff, metrics, failure modes and limitations.

## 14.3 Integration/end-to-end tests
Enter legitimate test address with user-supplied API key → normalized property record → real comps if available → calculation/abstention → evidence sources → view in Next.js. Verify no 500 errors, no invented URLs, no secrets in browser devtools, and reliable Vercel/Railway communication.

## 14.4 Maintainable ongoing checks
Monitor 429 quotas, 5xx, latency, stale data, citation URL validity where permitted, abnormal provider schema changes, estimate shifts, audit failures and later outcome reconciliation. Add basic server-side logging with request ID, never log sensitive API keys or unnecessary owner details.

---

# 15. DEPLOYMENT: RAILWAY BACKEND + VERCEL FRONTEND

**This entire section MUST be implemented, documented AND explained interactively to the human owner AFTER generating code. The agent must ask only for actual service credentials/URLs at the point needed, never request secrets to be pasted into chat or committed to Git.**

## 15.1 Architecture and service ownership
- GitHub repository: `realvalue` monorepo.
- Vercel project deploys **only** `apps/web` (set project root directory; confirm build settings).
- Railway API service deploys **only** `apps/api` (set root directory/build context and correct start command).
- Railway PostgreSQL in same Railway project, private database connection from API.
- Browser communicates with `https://<backend>.up.railway.app` or a custom API domain through HTTPS. Avoid calling provider APIs from browser.
- All external provider API keys stay on Railway **server only**.

## 15.2 Proposed environment variable contract
> **Variable names are proposed implementation choices; the coding agent must make code match exactly and document any changes. Never invent real credential values.**

### Railway API service (secret unless noted)
```
APP_ENV=production
DATABASE_URL=<Railway Postgres connection URL via Railway reference>
RENTCAST_API_KEY=<user-provisioned secret>            # if RentCast chosen
ATTOM_API_KEY=<optional, if adapter enabled>
FRED_API_KEY=<optional, only if FRED endpoint requires it>
LLM_API_KEY=<optional; deterministic evidence explanation works without it>
CORS_ALLOWED_ORIGINS=https://<project>.vercel.app,https://<custom-frontend-domain>
PUBLIC_API_BASE_URL=https://<api-service>.up.railway.app
ENABLE_LIVE_VALUATIONS=false                         # until credible algorithm/data tests pass
ENABLE_DEMO_MODE=true
LOG_LEVEL=INFO
PROVIDER_REQUEST_TIMEOUT_SECONDS=12
MAX_SEARCHES_PER_IP_PER_HOUR=30                       # proposed limit, configurable
```
Optional extras: `SENTRY_DSN`, `RATE_LIMIT_REDIS_URL`, `GEOCODING_API_KEY` only if actually used. Do not define or require absent integrations. **`PORT` is normally injected by Railway; listen on `0.0.0.0:${PORT}`.** Avoid hardcoding a local port in production. Keep database `DATABASE_URL` as a Railway service reference, don't expose DB to internet.

### Vercel Next.js project
```
NEXT_PUBLIC_API_BASE_URL=https://<api-service>.up.railway.app
```
Only non-secret browser-safe values get `NEXT_PUBLIC_`. In Next.js those public vars are embedded at build time, so update/redeploy when backend domain changes. For local dev `http://localhost:8000` is typical. If using a Next.js server-side proxy instead, document public vs server-only variables and adjust CORS accordingly.

### Local `apps/api/.env` example
```
APP_ENV=development
DATABASE_URL=postgresql+psycopg://<user>:<password>@localhost:5432/realvalue
RENTCAST_API_KEY=
CORS_ALLOWED_ORIGINS=http://localhost:3000
ENABLE_LIVE_VALUATIONS=false
ENABLE_DEMO_MODE=true
```
The actual SQLAlchemy driver and URL prefix must match installed package. Agent should provide Docker Compose or locally documented Postgres start, or optional local in-memory fake repository ONLY for development/test — no silent DB substitution in production.

### Local `apps/web/.env.local`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

All `.env` files containing secrets must be in `.gitignore`; commit only `.env.example` placeholders. Never paste keys into README, issue logs, public UI or example curl commands that are committed.

## 15.3 Backend runtime
Agent must verify official Railway FastAPI instructions [R13] and use a working setup. A typical Linux start command using shell expansion is:
```
sh -c 'uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}'
```
Adjust import path for chosen root, use correct quoting/context, and test in Railway logs. Configure healthcheck `/healthz`, public domain under service Networking / Public Networking, and confirm no CORS error. Railway healthchecks and generated domains documented [R14][R15].

Migrations: run `alembic upgrade head` as a controlled release/pre-deploy step or documented deploy strategy; do not race multiple app replicas running migrations. Database data must survive redeploys. Set sensitive variable values through Railway Variables UI, linking `DATABASE_URL` to PostgreSQL service using Railway's documented reference mechanism; the exact reference syntax should be confirmed live [R16].

## 15.4 Frontend deployment
- Import repo from GitHub into Vercel; project root `apps/web`.
- Verify framework auto-detected as Next.js and install/build works.
- Vercel Project → Settings → Environment Variables: set `NEXT_PUBLIC_API_BASE_URL` to Railway public HTTPS domain for Production (and Preview as appropriate).
- Redeploy when changed. Preview deployment origins may vary; for easiest MVP test use stable production domain and explicit CORS allow list, not a wildcard. [R17][R18]
- Make sure frontend network requests use public accessible backend domain and handle 404/429/503 with user-facing errors.

## 15.5 EXACT handholding instruction to coding agent
Once code is generated, **do NOT stop at “done.”** Produce `docs/DEPLOYMENT_HANDOFF.md` and present numbered human-friendly steps:
1. Prerequisites (Git, Node/Python version, GitHub, Railway, Vercel accounts).
2. Commands to run local API, database migration, backend test and UI.
3. How to get each provider API key, which plans/endpoint permissions to check, direct official signup/docs URLs, and where to enter it in local `.env` vs Railway dashboard; never ask owner to reveal keys in chat.
4. What each ENV variable means, whether it is required/optional, whether secret, and where to set it.
5. Push to GitHub (exact commands, branch naming as needed).
6. Railway: New Project, attach GitHub repo, API service root `apps/api`, add Postgres, configure variable references, healthcheck, start/build, generate domain, run smoke test.
7. Vercel: New Project, import same repo, root `apps/web`, env API base URL, deploy, copy deployment URL.
8. Set Railway `CORS_ALLOWED_ORIGINS` to the exact Vercel origin; trigger redeploy and rerun request test.
9. Copy-pastable smoke-test curl for `/healthz`, example property query (must not expose credentials) and checking citations.
10. Troubleshooting matrix (401 vendor key, 429 quota, 404 address, CORS, 502 upstream, bad `DATABASE_URL`, wrong Railway root, wrong `PORT`, Vercel wrong env, missing tables/migrations, invalid permissions).
11. Explicit cost warning for per-call provider charges, cloud bills and API quotas; ability to turn off live provider calls.
12. Confirm actual live website URL and backend health, or explain exactly why not possible without account actions.

If agent cannot directly deploy because accounts are unconnected, generate deployable code and guide owner; do not falsely claim a successful live deployment.

---

# 16. SECURITY, LICENSING, FAIRNESS AND PROFESSIONAL LIMITS

- Respect provider Terms of Service, permitted derived-value use, redistribution, commercial display and retention. Consult counsel before professional/high-stakes launch.
- Never expose API secrets in client-side bundles, `NEXT_PUBLIC_*`, browser responses or logs.
- Validate/sanitize address parameters; use outbound allowlisted provider domains, request limits and secure CORS.
- Avoid displaying owner names or personally identifying information unless necessary, permitted and justified; prototype does not require owner details.
- Explain experimental accuracy honestly; no claim “certified appraisal” or “guaranteed ±5%.”
- Consider U.S. consumer / housing fair-lending and discrimination concerns; evaluate group error and potentially biased location proxies. Use professional legal guidance.
- The 2025 federal AVM quality-control rule specifically applies to covered users/transactions; if RealValue enters mortgage collateral valuation, seek counsel and operationalize quality controls. [R9]
- Version and archive model changes. Maintain ability to correct records and explain historical valuation changes.
- No model output for lending underwriting or litigation without separate scope review, quality systems and professional participation.

---

# 17. DEVELOPMENT PHASES AND ACCEPTANCE GATES

## Phase 0 — Repo, research and technical feasibility
Deliver verified provider comparison, cost/rights matrix, architecture decision record, minimal source schema, local env templates, deploy skeleton and fixtures. Document what remains uncertain.
**Pass:** `pytest` + frontend build succeeds, API `/healthz`, demo report with fully fictional source IDs and banner.

## Phase 1 — Live address lookup + provenance
One real permitted provider; normalize address/attributes and retrieve closed comps; source details and dates, caching and errors.
**Pass:** a user-provided real address pulls live attributable records and shows sources; no mock fallback in live mode.

## Phase 2 — Explainable baseline calculator
Market-supported comp selection, proper time handling, structured adjustments based on fitted/evidenced methodology; deterministic explanation, status labels and abstention.
**Pass:** adjustments reconcile mathematically, inputs and source links inspectable, missingness reported, tests on fixtures.

## Phase 3 — Backtesting + range calibration
Build dataset, temporal split, compare baselines, learn adjustments/weights, produce holdout report, calibrate interval.
**Pass:** independent metrics and subgroup/coverage report; change accuracy claim only when criteria achieved.

## Phase 4 — Vercel/Railway user-facing pilot
Stable local/prod config, rate limits, logging, CORS, working deployed UI/API, smoke tests, documented env vars and manual walkthrough.
**Pass:** user can go to site, query real supported address, view property facts and comps, and see status/limitations with citations.

## Phase 5 — professional improvement
Add expert-review workflow, richer condition data, additional vendors, licensing compliance, better model, optional LLM narrative and geographic expansion.

**Implementation instruction:** Do not “fake” phases by showing a decorative estimate. Where a real predictive model is not yet available, ship Phase 1 honestly and prepare Phase 2–3 code scaffolding.

---

# 18. MANDATORY FURTHER RESEARCH FOR CODING AGENT

The agent MUST do additional current research (official/current docs primarily), and write `docs/RESEARCH_LOG.md` with dated links, findings, applicability and open questions **before finalizing algorithm/provider integrations**.

Research agenda:
1. Review Fannie Mae Selling Guide B4-1.3-08 and 09 and March 2026 appraiser update for comp selection, market-supported adjustments and market-condition adjustment.
2. Review FHFA's underadjustment paper and repeat-sales HPI methodology, geographic granularity and release vintages.
3. Investigate statistical home AVM literature: repeat-sales (Bailey, Muth & Nourse; Case-Shiller), hedonic price models (Rosen), spatial models, ML AVMs, and robust price calibration. Seek peer-reviewed work on local pooling, missing condition, sample selection, transaction leakage, price indices and temporal conformal intervals. Differentiate well-established theory from a speculative enhancement.
4. Verify RentCast / ATTOM live endpoint field contracts, vendor pricing, credits, quotas, source URLs, derived works rights, stored outputs and redistribution restrictions; recommend low-cost first provider with a decision table.
5. Confirm address normalization/geocoding provider and usage rights; unit/condo accuracy.
6. Verify official Railway + Vercel latest deployment/monorepo/env docs and correct settings; don't blindly trust the values in this spec if docs have changed.
7. Check whether source citations can link to public county assessor/recorder pages for chosen pilot market without fabricating direct deed links.
8. Design geographically appropriate pilot backtest data, train/calibration/test cutoffs, look-ahead-leakage checks and sample sizes.
9. Analyze what market indicators provide *incremental* predictive value beyond transaction-price trend; provide ablation plan not arbitrary coefficients.
10. Review ethical/legal applicability and licensing; document uncertainties rather than asserting compliance.
11. Research whether licensed third-party AVM outputs may be used as benchmarks/ensemble components and whether displaying them requires attribution/approval.
12. Research best practice for HTTPX retries/timeout, secrets, rate limiting and robust source provenance; prioritize simplicity.

Research results must be linked with authoritative URLs and a confidence/last-checked note. **Do not pretend to have independently tested RealValue accuracy without running the experiment.**

---

# 19. COPY-PASTE INSTRUCTION TO ANTIGRAVITY / VS CODE AGENT

> You are the lead engineer and quantitative real estate valuation researcher for RealValue. FIRST read `REALVALUE_MASTER_BUILD_AND_VALUATION_SPEC.md` end to end. This is the project source of truth. Prioritize an honest, testable valuation methodology, not superficial design. Conduct additional independent research using current authoritative sources; record findings and vendor/API/legal uncertainties in `docs/RESEARCH_LOG.md`. Produce an implementation plan and build a minimal but working full-stack monorepo: Next.js TypeScript frontend for Vercel; FastAPI Python backend plus Postgres for Railway. Support residential address lookup via a real, licensed property-data API, source-linked normalized property records, eligible closed comparable sales, an explainable comp-based baseline/calculation pipeline with no arbitrary unsupported adjustment values, uncertainty status/abstention, and deterministic citation-grounded narrative. Preserve inputs, adjustments, source IDs and provenance. Do NOT claim 5% accuracy or a calibrated 90% interval without actual held-out backtests. Use test fixtures clearly labeled demo, never silent mocks for live requests. Implement tests and docs including `.env.example`, backend/frontend commands, Railway database migration, deployment and CORS. After code generation, walk me through all required credentials, environment variables, Railway backend/PostgreSQL and Vercel frontend setup **click by click and command by command**. Do not demand secret keys in chat. If current data cannot support a sound valuation, say so and still show the property facts. Give me a runnable prototype plus an explicit quantitative-validation backlog.

---

# 20. RESEARCH REFERENCES — OFFICIAL / PRIMARY SOURCES FIRST

These URLs were checked via web search on 2026-11-22. They document industry methodology and platform capabilities; they are NOT evidence that RealValue itself has met its goals. Recheck live documentation during implementation.

**[R1] Fannie Mae Selling Guide — Adjustments to Comparable Sales.**  
https://selling-guide.fanniemae.com/sel/b4-1.3-09/adjustments-comparable-sales

**[R2] Fannie Mae Selling Guide — Comparable Sales.**  
https://selling-guide.fanniemae.com/sel/b4-1.3-08/comparable-sales

**[R3] FHFA — Underutilization of Appraisal Time Adjustments.**  
https://www.fhfa.gov/blog/insights/underutilization-of-appraisal-time-adjustments

**[R4] Zillow — Zestimate Accuracy (figures change by refresh).**  
https://www.zillow.com/zestimate/

**[R5] Fannie Mae — Appraiser Update March 2026.**  
https://singlefamily.fanniemae.com/originating-underwriting/appraisers/appraiser-update-march-2026

**[R6] RentCast — Developer API Introduction.**  
https://developers.rentcast.io/reference/introduction

**[R7] RentCast — Property Records, Value Estimate, Property Valuation.**  
https://developers.rentcast.io/reference/property-records  
https://developers.rentcast.io/reference/value-estimate  
https://developers.rentcast.io/reference/property-valuation

**[R8] RESO — Data access is licensed from providers, not RESO; Web API.**  
https://www.reso.org/ht-faq/new-faq-question-156/  
https://www.reso.org/reso-web-api/

**[R9] FHFA — AVM Quality Control Final Rule, effective 2025-10-01.**  
https://www.fhfa.gov/regulation/federal-register/final-rule/quality-control-standards-for-automated-valuation-models

**[R10] ATTOM — Developer docs and sales history.**  
https://api.developer.attomdata.com/docs  
https://api.developer.attomdata.com/dlpv2docs

**[R11] FHFA — House Price Index and public data.**  
https://www.fhfa.gov/data/hpi  
https://www.fhfa.gov/data/uad/puf

**[R12] FRED and mortgage rate series.**  
https://fred.stlouisfed.org/  
https://fred.stlouisfed.org/series/MORTGAGE30US

**[R13] Railway — Deploy FastAPI.**  
https://railway.com/guides/fastapi

**[R14] Railway — Public Networking.**  
https://docs.railway.com/networking/public-networking

**[R15] Railway — Healthchecks.**  
https://docs.railway.com/deployments/healthchecks

**[R16] Railway — Variables and reference variables.**  
https://docs.railway.com/variables

**[R17] Vercel — Environment Variables.**  
https://vercel.com/docs/environment-variables

**[R18] Next.js — Environment Variables and NEXT_PUBLIC_ semantics.**  
https://nextjs.org/docs/app/guides/environment-variables

**[R19] Railway — Deploying a Monorepo.**  
https://docs.railway.com/deployments/monorepo

**[R20] Vercel — Project Settings.**  
https://vercel.com/docs/project-configuration/project-settings

**[R21] Federal Reserve — AVM quality controls scope text.**  
https://www.federalreserve.gov/frrs/regulations/section-225352-quality-control-standards.htm

---

# 21. DECISION LOG AND OPEN QUESTIONS

## Confirmed user decisions
- Build a REAL prototype rather than a pure visual mockup.
- Address search is primary UX; property detail is extensive and scrollable.
- Valuation estimate + uncertainty range + concise evidence-linked explanation.
- Cite origin/records and link supporting data where available.
- Statistical reliability is top priority; aspiration roughly within 5% actual transaction value, NOT an unconditional 5%-wide interval.
- **Railway = backend + PostgreSQL. Vercel = frontend.**
- Developer begins from VS Code / Google Antigravity and must receive explicit ENV/deployment handholding.
- Coding AI should perform further research, not merely implement undocumented constants.
- UI should be functional and clean but visual polish is a low priority.

## Decisions still to validate
- First pilot metro/county and supported property types.
- Exact vendor(s), access tiers, licensing conditions and per-lookup economics.
- Suitable historical transaction dataset and training/evaluation sample size.
- Whether first release has a validated proprietary value or only a transparently labeled experimental indicator.
- Time-index granularity and method, data vintage and missingness strategy.
- Data privacy and retention policy, source public-link coverage.
- Exact uncertainty algorithm and minimum coverage thresholds by submarket.
- Public consumer access vs restricted pilot access while unvalidated.
- Which (if any) LLM provider is worth adding after deterministic evidence narratives.

## Final engineering acceptance statement
A successful prototype is NOT one that displays an attractive plausible number for any typed address. A successful prototype is one that retrieves verifiable real data where authorized, performs a **defined reproducible calculation**, keeps a **correct audit trail**, exposes the **actual evidence**, labels uncertainty honestly, works across **Railway/Vercel**, and makes it feasible to measure and improve RealValue's true predictive accuracy toward the 5% goal.
