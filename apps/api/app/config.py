from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = ""
    price_per_search_cents: int = 400
    rentcast_api_key: str = ""
    cors_allowed_origins: str = "http://localhost:3000"
    cors_allowed_origin_regex: str = r"https://.*\.vercel\.app"
    enable_live_valuations: bool = False
    enable_demo_mode: bool = True
    provider_request_timeout_seconds: float = 12
    max_searches_per_ip_per_hour: int = 30
    valuation_cache_ttl_seconds: int = 21600
    valuation_cache_max_entries: int = 200
    address_search_cache_ttl_seconds: int = 21600
    address_search_min_chars: int = 5

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
