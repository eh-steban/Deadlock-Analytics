from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from app.utils.datetime_utils import utcnow

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    steam_id: str = Field(index=True, unique=True, nullable=False)
    email: Optional[str] = Field(default=None, unique=True, nullable=True)
    created_at: datetime = Field(default_factory=lambda: utcnow(), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: utcnow(), nullable=False)