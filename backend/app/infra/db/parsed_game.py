from datetime import datetime
from sqlmodel import Column, SQLModel, Field
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import LargeBinary
from app.utils.datetime_utils import utcnow

class ParsedGame(SQLModel, table=True):
    """Parsed game storage.

    Fields mirror the updated migration (a5efbb84a293):
    - raw_payload_gzip: original gzipped parser payload bytes
    - game_data: for data shape, see MatchAnalysis domain model - ParsedGameData
    - etag: SHA‑256 hex digest of canonical uncompressed *raw* payload
    - schema_version: allows future transform/schema evolution
    """

    game_id: int = Field(primary_key=True, index=True)
    schema_version: int = Field(default=1, index=True)
    raw_payload_gzip: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    game_data: dict = Field(sa_column=Column(JSONB, nullable=False))
    etag: str = Field(nullable=False, index=True)
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=utcnow, nullable=False)
