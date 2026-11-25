from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_demo_valuation_is_explicitly_unvalidated():
    response = client.post("/api/v1/valuations", json={"address": "123 Fictional Ave, Austin, TX 78704", "demo": True})
    assert response.status_code == 200
    body = response.json()
    assert body["estimate_status"] == "experimental_market_indicator"
    assert body["estimate_cents"] is not None
    assert body["interval_low_cents"] is None
    assert "DEMO — NOT A LIVE VALUATION" in body["disclaimers"]


def test_address_search_short_query_returns_empty_matches():
    response = client.post("/api/v1/address/search", json={"q": "123"})
    assert response.status_code == 200
    assert response.json() == {"matches": []}
