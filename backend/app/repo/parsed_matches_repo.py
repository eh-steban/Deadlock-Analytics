from typing import Annotated
from fastapi.params import Depends
from sqlmodel import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from app.infra.db.parsed_match_payload import ParsedMatchPayload
from app.infra.db.session import get_db_session
from app.domain.exceptions import (
    MatchDataUnavailableException,
    MatchParseException,
    MatchDataIntegrityException,
)

class ParsedMatchesRepo:
    async_session: Annotated[AsyncSession, Depends(get_db_session)]

    async def get_payload(self, match_id: str, schema_version: int, session: Annotated[AsyncSession, Depends(get_db_session)]) -> dict:
        try:
            stmt = select(ParsedMatchPayload).where(
                ParsedMatchPayload.match_id == match_id,
                ParsedMatchPayload.schema_version == schema_version
            )
            result = await session.execute(stmt)
            record = result.scalar_one_or_none()
            if record is None:
                raise MatchDataUnavailableException(
                    f"No parsed payload found for match_id={match_id}, schema_version={schema_version}"
                )
            if not record.payload_json:
                raise MatchDataIntegrityException(
                    f"Payload JSON missing for match_id={match_id}, schema_version={schema_version}"
                )
            return record.payload_json
        except SQLAlchemyError as e:
            raise MatchDataUnavailableException(f"DB error: {str(e)}")

    async def upsert_payload(self, match_id: str, schema_version: int, payload: dict, etag: str, session: Annotated[AsyncSession, Depends(get_db_session)]) -> None:
        try:
            stmt = select(ParsedMatchPayload).where(
                ParsedMatchPayload.match_id == match_id,
                ParsedMatchPayload.schema_version == schema_version
            )
            result = await session.execute(stmt)
            record = result.scalar_one_or_none()
            if record:
                record.payload_json = payload
                record.etag = etag
            else:
                record = ParsedMatchPayload(
                    match_id=match_id,
                    schema_version=schema_version,
                    payload_json=payload,
                    etag=etag
                )
                session.add(record)
            await session.commit()
        except SQLAlchemyError as e:
            raise MatchDataIntegrityException(f"Upsert failed: {str(e)}")

    async def exists(self, match_id: str, schema_version: int, session: Annotated[AsyncSession, Depends(get_db_session)]) -> bool:
        stmt = select(ParsedMatchPayload.match_id).where(
            ParsedMatchPayload.match_id == match_id,
            ParsedMatchPayload.schema_version == schema_version
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None
