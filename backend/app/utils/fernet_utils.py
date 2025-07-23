import os
from cryptography.fernet import Fernet
from app.config import get_settings

settings = get_settings()
FERNET_SECRET_KEY = settings.FERNET_SECRET_KEY

if FERNET_SECRET_KEY is None:
    raise RuntimeError("FERNET_SECRET_KEY not set in environment.")

fernet = Fernet(FERNET_SECRET_KEY)

def encrypt_steam_id(steam_id: str) -> str:
    return fernet.encrypt(steam_id.encode()).decode()

def decrypt_steam_id(encrypted: str) -> str:
    return fernet.decrypt(encrypted.encode()).decode()