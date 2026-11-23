# Research Log

**Last checked:** 2026-11-22

| Topic | Source | Finding / implementation implication | Confidence |
|---|---|---|---|
| RentCast property records | https://developers.rentcast.io/reference/property-records | Address, pagination, property attributes, sale history and property owner fields are available; sale-price availability varies in non-disclosure states. API key header is provider-specific and live pricing/terms must be rechecked. | Current official docs fetched |
| RentCast valuation/comps | https://developers.rentcast.io/reference/property-valuation | It returns proprietary AVM and listing-based comparables. RealValue will not initially label that proprietary result as its own validated model. | Current official docs fetched |
| RentCast licensing | https://developers.rentcast.io/reference/introduction | The docs describe flexible permitted commercial use and storage, but the live Terms of Use and a data contract must be reviewed before production distribution. | Official docs, not legal advice |
| Railway monorepo | https://docs.railway.com/deployments/monorepo | Set API root directory to `/apps/api`; set public networking and bind to injected `PORT`. | Current official docs fetched |
| Railway variables | https://docs.railway.com/variables | Use service variables or sealed/sealed-style secrets and redeploy after changes. | Current official docs fetched |
| Vercel/Next.js env | https://vercel.com/docs/environment-variables and https://nextjs.org/docs/app/guides/environment-variables | `NEXT_PUBLIC_*` is build-time/inlined. Set and redeploy for the backend URL. | Current official docs fetched |

## Open items

- Obtain and verify a provider account/key, current paid plan, credits, retention and public-display permissions.
- Identify a defensible pilot geography and historical closed-deal dataset.
- Verify whether RentCast's returned “sold” data represents closed deal, listing removal, or listing price without silently asserting a sale event.
- Choose and source an as-of-date market-time index with historical vintages.
- Fit and test all coefficients before enabling live estimates.
