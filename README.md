# RealValue

A transparent prototype for evidence-linked residential valuation. It includes a FastAPI backend, Next.js frontend, explicit demo mode, a provider adapter boundary, and a conservative algorithm/test scaffold.

## Truthful status

No numerical result in this repository is a validated market value. The demo result is synthetic and uncalibrated. Live provider calls are disabled until a registered historical dataset and held-out backtest pass the acceptance gates.

## Run locally

Backend:

```sh
cd apps/api
python3.13 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'  # if your pip version supports groups, otherwise pip install fastapi uvicorn httpx pydantic-settings pytest
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Frontend:

```sh
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Test

```sh
cd apps/api
source .venv/bin/activate
pytest
```

## Key documentation

- `docs/ALGORITHM.md`
- `docs/RESEARCH_LOG.md`
- `docs/DEPLOYMENT_HANDOFF.md`
- `REALVALUE_MASTER_BUILD_AND_VALUATION_SPEC.md`
