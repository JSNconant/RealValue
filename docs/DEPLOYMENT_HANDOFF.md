# Deployment Handoff

## Local API

Prerequisites: Python 3.12+ and PostgreSQL only if database persistence is added for the run. The first prototype needs neither a database nor provider credentials.

```sh
cd apps/api
python3.13 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'  # or: pip install fastapi uvicorn httpx pydantic-settings pytest
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs and call `/healthz`.

## Local frontend

```sh
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Add a provider account

1. Create a RentCast API account only in your own dashboard: https://app.rentcast.io/app/api
2. Review current plans and the Terms of Use: https://developers.rentcast.io/reference/billing-and-pricing
3. Create a restricted key; do not paste it into chat or Git.
4. Put it in `apps/api/.env` locally.
5. Keep live valuation disabled until the validation gate is passed.

## Railway API

1. Create a Railway project and an empty API service.
2. Connect the GitHub repository.
3. Set Root Directory to `/apps/api`.
4. Set Start Command to `sh -c 'uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}'`.
5. Set Variables: `APP_ENV=production`, `ENABLE_DEMO_MODE=true`, `ENABLE_LIVE_VALUATIONS=false`, `CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`, and optionally the provider key as a sealed variable.
6. Add a health check at `/healthz`.
7. Generate a Railway public domain.

## Vercel frontend

1. Import the same GitHub repository.
2. Set Project Root to `apps/web`.
3. Set `NEXT_PUBLIC_API_BASE_URL=https://<railway-domain>` for Production and Preview.
4. Redeploy after setting or changing the variable.

## CORS smoke test

```sh
curl https://<railway-domain>/healthz
curl -X POST https://<railway-domain>/api/v1/valuations \
  -H 'Content-Type: application/json' \
  -d '{"address":"123 Fictional Ave, Austin, TX 78704","demo":true}'
```

Open the Vercel URL and confirm that the page shows `DEMO — NOT A LIVE VALUATION`.

## Troubleshooting

- 503 live disabled: expected until `ENABLE_LIVE_VALUATIONS=true` and a model passes validation.
- CORS: exact Vercel origin must be in Railway `CORS_ALLOWED_ORIGINS`.
- Wrong API URL: `NEXT_PUBLIC_API_BASE_URL` is build-time public configuration; redeploy after changing it.
- 401/403 provider: key invalid or endpoint permission/quota issue.
- 429: provider quota or local rate limit.
- Wrong Railway root: set `/apps/api`, not repository root.
