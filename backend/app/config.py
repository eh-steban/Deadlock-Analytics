import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

@lru_cache
def get_settings():
    return Settings()

class Settings(BaseSettings):
    # environment: str = os.getenv("ENVIRONMENT", "development")
    JWT_SECRET_KEY: str = "secretKey"
    JWT_ALGORITHM: str = "algo"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    API_KEY: str = "key"
    STEAM_ID: str = "steamId"
    REPLAY_FILE_PATH: str = "filePath"
    DEADLOCK_API_DOMAIN: str = "apiDomain"
    POSTGRES_USER: str = "user"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "db"
    DATABASE_URL: str = "url"
    FERNET_SECRET_KEY: str = "key"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)