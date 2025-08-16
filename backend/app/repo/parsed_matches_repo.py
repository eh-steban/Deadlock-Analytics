from typing import Annotated
from fastapi.params import Depends
from sqlmodel import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.db.parsed_match import ParsedMatch
from app.infra.db.session import get_db_session
from app.domain.exceptions import (
    MatchDataUnavailableException,
    MatchParseException,
    MatchDataIntegrityException,
)

class ParsedMatchesRepo:
    async_session: Annotated[AsyncSession, Depends(get_db_session)]

    async def get_payload(self, match_id: int, schema_version: int, session: Annotated[AsyncSession, Depends(get_db_session)]) -> dict | None:
        try:
            stmt = select(ParsedMatch).where(
                ParsedMatch.match_id == match_id,
                ParsedMatch.schema_version == schema_version
            )
            result = await session.execute(stmt)
            record = result.scalar_one_or_none()
            if record is None or not record.payload_json:
                return None
            return record.payload_json
        except SQLAlchemyError as e:
            raise SQLAlchemyError(f"DB error: {str(e)}")

    async def upsert_payload(self, match_id: int, schema_version: int, payload: dict, etag: str, session: Annotated[AsyncSession, Depends(get_db_session)]) -> bool:
        try:
            stmt = select(ParsedMatch).where(
                ParsedMatch.match_id == match_id,
                ParsedMatch.schema_version == schema_version
            )
            result = await session.execute(stmt)
            record = result.scalar_one_or_none()
            if record:
                record.payload_json = payload
                record.etag = etag
            else:
                record = ParsedMatch(
                    match_id=match_id,
                    schema_version=schema_version,
                    payload_json=payload,
                    etag=etag
                )
                session.add(record)
            await session.commit()
            return True
        except SQLAlchemyError as e:
            raise MatchDataIntegrityException(f"Upsert failed: {str(e)}")
