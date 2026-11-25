# RealValue Pricing Algorithm

## Status

This prototype implements no validated real-estate pricing model. It has a fixture-only experimental demonstrator and a live-provider admission gate. The output must not be described as accurate, appraised, or suitable for underwriting.

## Estimand

At a specified date `t`, RealValue aims to estimate the cash-equivalent exchange price for an arm's-length residential sale under ordinary terms. The prototype has not been trained or calibrated to this target.

## V1 calculation

1. Resolve a subject property and preserve the provider record.
2. Discover recent closed/verified transaction records of the same property type.
3. Reject records missing a positive sale amount or sale date.
4. Reject mismatched property types and future-dated records.
5. Deduplicate repeated transaction records.
6. Rank remaining comps by a transparent distance/area/age similarity calculation.
7. Convert the positive sale prices to cents and reconcile with a weighted median.

No uncompensated adjustment in dollars is invented for bedrooms, bathrooms, living area, condition, or lot size. This avoids false precision. A sourced market-time factor may be added only after the source's date vintage and geography are validated.

## Formula

For comp `j`:

`raw_j = transaction sale price`

`w_j = max(0.05, min(1, 1 / ((1 + 0.35*distance_miles)*(1 + 2.5*area_delta)*(1 + 0.025*age_delta))))`

The weights are demonstration defaults. The point indicator is the weighted median of `raw_j`. They are not coefficients learned from local transactions and are not a calibrated prediction interval.

## Abstention

Live numeric estimates are disabled until backtesting is complete. A live lookup returns `insufficient_evidence` when fewer than three qualifying attributable closed records are found and otherwise remains blocked behind the model-validation gate.

## Required validation before launch

- Chronological train/calibration/test splits.
- Held-out arm's-length transaction outcomes.
- Time-varying and geographic holdouts.
- MdAPE, MAPE, P75/P90/P95 APE, within-5%, within-10%, signed error and coverage.
- Independent calibration of future predictive intervals.
- Subgroup and drift analysis.
- Model card and go/no-go approval.

## Live provider engine (v0.1)

The live implementation requires RentCast property-record support for the subject and provider-recorded last-sale facts for comparable properties. It:

- verifies supported residential property types;
- requires subject living area;
- removes the subject itself and future-dated sales;
- removes nonmatching property types and sales older than 365 days;
- applies hard filters for living-area difference and 10-mile distance;
- weights candidates by distance, living area, effective age, lot area, ZIP match and recency;
- reconciles raw sale prices with a weighted median;
- requires at least three qualifying records;
- exposes every exclusion reason and source record ID.

The live engine does not invent structural, condition or market-time adjustments. Missing condition and unknown concessions widen caveats. It publishes no descriptive spread as a predictive interval. It remains `experimental_market_indicator` and must not be used as an appraisal or lending opinion.
