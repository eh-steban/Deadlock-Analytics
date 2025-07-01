from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from app.services.auth.manage_jwt_token import decode_access_token
from app.domain.users.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(request: Request, token: str = Depends(oauth2_scheme)) -> User:
    try:
        steam_id = decode_access_token(token)
        return User(steam_id=steam_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
