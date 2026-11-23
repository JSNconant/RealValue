from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    rentcast_api_key: str = ""
    cors_allowed_origins: str = "http://localhost:3000"
    enable_live_valuations: bool = False
    enable_demo_mode: bool = True
    provider_request_timeout_seconds: float = 12
    max_searches_per_ip_per_hour: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
