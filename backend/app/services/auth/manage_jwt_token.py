import jwt
from datetime import timedelta
from typing import Optional, Annotated
from fastapi import Depends
from app.config import Settings, get_settings
from app.utils.datetime_utils import utcnow

SettingsDep = Annotated[Settings, Depends(get_settings)]

def create_access_token(user_id: int, settings: SettingsDep, expires_delta: Optional[timedelta] = None) -> str:
    now = utcnow()
    expire = now + (expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {
        "id": user_id,
        "iat": now,
        "exp": expire
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def decode_access_token(token: str, settings: SettingsDep) -> str:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "iat"]},
        )
        user_id: str = payload["user_id"]
        if user_id is None:
            raise ValueError("Missing user_id in token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.MissingRequiredClaimError as e:
        raise ValueError(f"Missing required claim: {e.claim}")
    except jwt.PyJWTError as e:
        raise ValueError(f"Invalid token: {e}")
