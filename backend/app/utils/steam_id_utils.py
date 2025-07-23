import hashlib
from cryptography.fernet import Fernet
from app.config import get_settings

settings = get_settings()
FERNET_SECRET_KEY = settings.FERNET_SECRET_KEY
STEAM_HASH_SALT = settings.STEAM_HASH_SALT

if FERNET_SECRET_KEY is None or STEAM_HASH_SALT is None:
    raise RuntimeError("FERNET_SECRET_KEY or STEAM_HASH_SALT not set in environment.")

fernet = Fernet(FERNET_SECRET_KEY)

def hash_steam_id(steam_id: str) -> str:
    salt = settings.STEAM_HASH_SALT.encode()
    return hashlib.sha256(salt + steam_id.encode()).hexdigest()

def encrypt_steam_id(steam_id: str) -> str:
    return fernet.encrypt(steam_id.encode()).decode()

def decrypt_steam_id(encrypted: str) -> str:
    return fernet.decrypt(encrypted.encode()).decode()