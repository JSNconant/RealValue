from __future__ import annotations

import httpx


class RentCastProvider:
    base_url = "https://api.rentcast.io/v1"

    def __init__(self, api_key: str, timeout: float):
        self.api_key = api_key
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        return {"accept": "application/json", "X-Api-Key": self.api_key}

    async def search_properties(self, address: str) -> list[dict]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/properties",
                params={"address": address, "limit": 10},
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()
            return data if isinstance(data, list) else []

    async def search_sold_comps(self, address: str, radius_miles: float = 3.0) -> list[dict]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/properties",
                params={
                    "address": address,
                    "radius": radius_miles,
                    "saleDateRange": "365",
                    "limit": 100,
                    "includeTotalCount": "true",
                },
                headers=self._headers(),
            )
            response.raise_for_status()
            data = response.json()
            return data if isinstance(data, list) else []
