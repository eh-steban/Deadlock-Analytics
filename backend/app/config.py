import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

def get_env_variable(var_name: str, default: str) -> str:
    return os.getenv(var_name, default)

@lru_cache
def get_settings():
    return Settings()

class Settings(BaseSettings):
    JWT_SECRET_KEY: str = get_env_variable("JWT_SECRET_KEY", "JWT_SECRET_KEY")
    JWT_ALGORITHM: str = get_env_variable("JWT_ALGORITHM", "JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    API_KEY: str = get_env_variable("API_KEY", "API_KEY")
    STEAM_ID: str = get_env_variable("STEAM_ID", "STEAM_ID")
    REPLAY_FILE_PATH: str = get_env_variable("REPLAY_FILE_PATH", "REPLAY_FILE_PATH")
    DEADLOCK_API_DOMAIN: str = get_env_variable("DEADLOCK_API_DOMAIN", "DEADLOCK_API_DOMAIN")
    POSTGRES_USER: str = get_env_variable("POSTGRES_USER", "POSTGRES_USER")
    POSTGRES_PASSWORD: str = get_env_variable("POSTGRES_PASSWORD", "POSTGRES_PASSWORD")
    POSTGRES_DB: str = get_env_variable("POSTGRES_DB", "POSTGRES_DB")
    DATABASE_URL: str = get_env_variable("DATABASE_URL", "DATABASE_URL")

    model_config = SettingsConfigDict(env_file=".env")
