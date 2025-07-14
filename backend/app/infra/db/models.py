from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from app.utils.datetime_utils import utcnow

class UserTable(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: utcnow(), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: utcnow(), nullable=False)