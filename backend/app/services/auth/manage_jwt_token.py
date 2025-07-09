import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.config import settings

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "iat": now,
        "exp": expire
    })
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "iat"]},
        )
        steam_id: str = payload["steam_id"]
        if not steam_id:
            raise ValueError("Missing steam_id in token")
        return steam_id
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.MissingRequiredClaimError as e:
        raise ValueError(f"Missing required claim: {e.claim}")
    except jwt.PyJWTError as e:
        raise ValueError(f"Invalid token: {e}")
