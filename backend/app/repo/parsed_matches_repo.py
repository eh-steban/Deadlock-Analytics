import logging
from typing import Annotated, Optional
from fastapi.params import Depends
from sqlmodel import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.match_analysis import ParsedGameData
from app.infra.db.parsed_match import ParsedMatch
from app.infra.db.session import get_db_session
from app.domain.exceptions import (
    MatchDataUnavailableException,
    MatchParseException,
    MatchDataIntegrityException,
)

logger = logging.getLogger(__name__)

class ParsedMatchesRepo:
    async_session: Annotated[AsyncSession, Depends(get_db_session)]

    async def get_per_player_data(
        self,
        match_id: int,
        schema_version: int,
        session: Annotated[AsyncSession, Depends(get_db_session)],
    ) -> ParsedGameData | None:
        try:
            logger.info(f"Fetching per_player_data for match_id={match_id}, schema_version={schema_version}")

            stmt = select(ParsedMatch).where(
                ParsedMatch.match_id == match_id,
                ParsedMatch.schema_version == schema_version,
            )
            result = await session.execute(stmt)
            record = result.scalar_one_or_none()

            if record is None:
                return None

            return ParsedGameData(**record.per_player_data)

        except SQLAlchemyError as e:
            raise MatchDataIntegrityException(f"Fetch per_player_data failed: {e}")

    async def get_raw_gzip(
        self,
        match_id: int,
        schema_version: int,
        session: Annotated[AsyncSession, Depends(get_db_session)],
    ) -> Optional[bytes]:
        try:
            stmt = select(ParsedMatch.raw_payload_gzip).where(
                ParsedMatch.match_id == match_id,
                ParsedMatch.schema_version == schema_version,
            )
            result = await session.execute(stmt)
            return result.scalar_one_or_none()
        except SQLAlchemyError as e:
            raise MatchDataIntegrityException(f"Fetch raw_payload_gzip failed: {e}")

    async def create_parsed_match(
        self,
        match_id: int,
        schema_version: int,
        raw_payload_gzip: bytes,
        total_match_time: int,
        per_player_data: dict,
        etag: str,
        session: Annotated[AsyncSession, Depends(get_db_session)],
    ) -> None:
        try:
            parsed_match = ParsedMatch(
                match_id=match_id,
                schema_version=schema_version,
                raw_payload_gzip=raw_payload_gzip,
                total_match_time=total_match_time,
                per_player_data=per_player_data,
                etag=etag,
            )
            session.add(parsed_match)
            await session.commit()
            await session.refresh(parsed_match)
        except SQLAlchemyError as e:
            logger.info(f"Create parsed match failed, : {e}")
