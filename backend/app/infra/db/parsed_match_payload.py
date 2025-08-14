from datetime import datetime
from typing import Optional
from sqlmodel import Column, SQLModel, Field
from sqlalchemy.dialects.postgresql import JSONB
from app.utils.datetime_utils import utcnow

class ParsedMatchPayload(SQLModel, table=True):
    match_id: int = Field(primary_key=True, index=True)
    schema_version: int = Field(default=1, index=True)
    payload_json: Optional[dict] = Field(sa_column=Column(JSONB))
    etag: Optional[str] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=lambda: utcnow(), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: utcnow(), nullable=False)
