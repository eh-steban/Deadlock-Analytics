from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from app.services.auth.manage_jwt_token import decode_access_token
from app.domain.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(request: Request, token: str = Depends(oauth2_scheme)) -> str:
    try:
        steam_id = decode_access_token(token)
        # FIXME: This is intentionally broken. This method never
        # gets called and I have implementation questions at this point
        # I'll fix this when I actually need this method.
        return steam_id
        # return User(id=steam_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
