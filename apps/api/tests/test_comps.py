from app.valuation.comps import haversine_miles, local_similarity_weight, robust_weighted_median
from app.valuation.live_comps import build_live_comparable_indicator
from datetime import date


def test_weighted_median():
    assert robust_weighted_median([(100_000, 1.0), (200_000, 1.0)]) == 100_000


def test_weighted_median_empty():
    try:
        robust_weighted_median([])
    except ValueError:
        return
    raise AssertionError("Expected ValueError")


def test_distance_and_property_type():
    assert haversine_miles(30, -97, 30, -97) == 0
    assert local_similarity_weight(distance_miles=1, area_delta_ratio=.1, age_delta_years=5, property_type_match=True) > 0
    assert local_similarity_weight(distance_miles=1, area_delta_ratio=.1, age_delta_years=5, property_type_match=False) == 0


def test_live_engine_requires_three_qualifying_sales():
    subject = {"id":"subject","propertyType":"Single Family","squareFootage":1800,"yearBuilt":1998,"latitude":30.245,"longitude":-97.775,"zipCode":"78704"}
    result = build_live_comparable_indicator(subject, [{
        "id":"comp-1","formattedAddress":"1 A St","propertyType":"Single Family","lastSalePrice":700000,
        "lastSaleDate":"2026-10-01T00:00:00Z","squareFootage":1750,"yearBuilt":1996,"latitude":30.245,"longitude":-97.775,"zipCode":"78704"
    }], date(2026, 11, 23))
    assert result["status"] == "insufficient_evidence"
    assert result["estimate_cents"] is None


def test_live_engine_excludes_future_sale():
    subject = {"id":"subject","propertyType":"Single Family","squareFootage":1800,"yearBuilt":1998,"latitude":30.245,"longitude":-97.775,"zipCode":"78704"}
    records = []
    for index, price in enumerate((700000, 710000, 720000), start=1):
        records.append({"id":f"comp-{index}","formattedAddress":f"{index} A St","propertyType":"Single Family","lastSalePrice":price,
                        "lastSaleDate":"2026-12-01T00:00:00Z","squareFootage":1750+index,"yearBuilt":1996,"latitude":30.245,"longitude":-97.775,"zipCode":"78704"})
    result = build_live_comparable_indicator(subject, records, date(2026, 11, 23))
    assert result["status"] == "insufficient_evidence"
    assert len(result["excluded"]) == 3


def test_live_engine_rejects_unsupported_property_type():
    result = build_live_comparable_indicator({"propertyType": "Land", "squareFootage": 0}, [], date(2026, 11, 23))
    assert result["status"] == "unsupported_property"
    assert result["estimate_cents"] is None
