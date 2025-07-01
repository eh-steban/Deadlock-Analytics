from pydantic import BaseModel

class User(BaseModel):
    steam_id: str
    # email: str
