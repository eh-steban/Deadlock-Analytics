import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # FIXME: I'm using these default values for now, but I'm sure there's
    # a better way to handle this.
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "JWT_SECRET_KEY")
    JWT_ALGORITHM: str =  os.getenv("JWT_ALGORITHM", "JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    API_KEY: str =  os.getenv("API_KEY", "API_KEY")
    STEAM_ID: str =  os.getenv("STEAM_ID", "STEAM_ID")
    REPLAY_FILE_PATH: str =  os.getenv("REPLAY_FILE_PATH", "REPLAY_FILE_PATH")
    DEADLOCK_API_DOMAIN: str =  os.getenv("DEADLOCK_API_DOMAIN", "DEADLOCK_API_DOMAIN")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "POSTGRES_USER")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "POSTGRES_PASSWORD")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "POSTGRES_DB")
    DATABASE_URL: str =  os.getenv("DATABASE_URL", "DATABASE_URL")

    model_config = SettingsConfigDict(env_file=".env")

@lru_cache
def get_settings():
    return Settings()
