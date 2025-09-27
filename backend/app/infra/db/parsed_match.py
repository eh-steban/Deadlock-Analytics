from datetime import datetime
from sqlmodel import Column, SQLModel, Field
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import LargeBinary
from app.utils.datetime_utils import utcnow

class ParsedMatch(SQLModel, table=True):
    """Parsed match storage.

    Fields mirror the updated migration (a5efbb84a293):
    - raw_payload_gzip: original gzipped parser payload bytes
    - per_player_data: derived player‑centric JSON structure
    - etag: SHA‑256 hex digest of canonical uncompressed *raw* payload
    - schema_version: allows future transform/schema evolution
    """

    match_id: int = Field(primary_key=True, index=True)
    schema_version: int = Field(default=1, index=True)
    raw_payload_gzip: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    total_match_time: int = Field(nullable=False)
    per_player_data: dict = Field(sa_column=Column(JSONB, nullable=False))
    etag: str = Field(nullable=False, index=True)
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)
