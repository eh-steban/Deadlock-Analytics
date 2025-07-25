
from typing import Optional, List
from sqlmodel import SQLModel

class SteamPlayer(SQLModel):
    steamid: str
    communityvisibilitystate: int
    profilestate: Optional[int] = None
    personaname: str
    profileurl: str
    avatar: str
    avatarmedium: str
    avatarfull: str
    avatarhash: str
    lastlogoff: Optional[int] = None
    personastate: Optional[int] = None
    primaryclanid: Optional[str] = None
    timecreated: Optional[int] = None
    personastateflags: Optional[int] = None

class SteamPlayersResponse(SQLModel):
    players: List[SteamPlayer]

class SteamAccountResponse(SQLModel):
    response: SteamPlayersResponse
