import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

def get_env_variable(var_name: str, default: str) -> str:
    return os.getenv(var_name, default)

@lru_cache
def get_settings():
    return Settings()

class Settings(BaseSettings):
    environment: str = "dev"

    JWT_SECRET_KEY: str = get_env_variable("JWT_SECRET_KEY", "secretKey")
    JWT_ALGORITHM: str = get_env_variable("JWT_ALGORITHM", "algo")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    API_KEY: str = get_env_variable("API_KEY", "key")
    STEAM_ID: str = get_env_variable("STEAM_ID", "steamId")
    REPLAY_FILE_PATH: str = get_env_variable("REPLAY_FILE_PATH", "filePath")
    DEADLOCK_API_DOMAIN: str = get_env_variable("DEADLOCK_API_DOMAIN", "apiDomain")
    POSTGRES_USER: str = get_env_variable("POSTGRES_USER", "user")
    POSTGRES_PASSWORD: str = get_env_variable("POSTGRES_PASSWORD", "password")
    POSTGRES_DB: str = get_env_variable("POSTGRES_DB", "db")
    if environment == "test":
        DATABASE_URL: str = "postgresql+psycopg://test_user:test_pass@localhost:5432/test_db"
    else:
        DATABASE_URL: str = get_env_variable("POSTGRES_DB", "url")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)
