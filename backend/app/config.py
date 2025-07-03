from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    API_KEY: str
    STEAM_ID: str
    REPLAY_FILE_PATH: str

    model_config = ConfigDict(env_file=".env")

settings = Settings()
