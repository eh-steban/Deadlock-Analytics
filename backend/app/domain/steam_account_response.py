from typing import Optional
from pydantic import BaseModel

class SteamAccountResponse(BaseModel):
    steam_id: str
    match_history: Optional[list[dict]] = []
    
