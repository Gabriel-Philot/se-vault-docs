from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    redis_url: str = "redis://localhost:6379/0"
    database_url: str = "postgresql://palantir:palantir@localhost:5432/palantir"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
