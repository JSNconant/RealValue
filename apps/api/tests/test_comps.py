from app.valuation.comps import haversine_miles, local_similarity_weight, robust_weighted_median


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
