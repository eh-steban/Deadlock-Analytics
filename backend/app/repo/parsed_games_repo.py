from typing import Annotated, Optional
from fastapi.params import Depends
from sqlmodel import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.match_analysis import TransformedGameData
from app.infra.db.parsed_game import ParsedGame
from app.infra.db.session import get_db_session
from app.domain.exceptions import (
    MatchDataUnavailableException,
    MatchParseException,
    MatchDataIntegrityException,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

class ParsedMatchesRepo:
    async_session: Annotated[AsyncSession, Depends(get_db_session)]

    async def get_game_data(
        self,
        game_id: int,
        schema_version: int,
        session: Annotated[AsyncSession, Depends(get_db_session)],
    ) -> TransformedGameData | None:
        try:
            logger.info(f"Fetching game_data for game_id={game_id}, schema_version={schema_version}")

            stmt = select(ParsedGame).where(
                ParsedGame.game_id == game_id,
                ParsedGame.schema_version == schema_version,
            )
            result = await session.execute(stmt)
            record = result.scalar_one_or_none()

            if record is None:
                return None

            return TransformedGameData(**record.game_data)

        except SQLAlchemyError as e:
            raise MatchDataIntegrityException(f"Fetch game_data failed: {e}")

    async def get_raw_gzip(
        self,
        game_id: int,
        schema_version: int,
        session: Annotated[AsyncSession, Depends(get_db_session)],
    ) -> Optional[bytes]:
        try:
            stmt = select(ParsedGame.raw_payload_gzip).where(
                ParsedGame.game_id == game_id,
                ParsedGame.schema_version == schema_version,
            )
            result = await session.execute(stmt)
            return result.scalar_one_or_none()
        except SQLAlchemyError as e:
            raise MatchDataIntegrityException(f"Fetch raw_payload_gzip failed: {e}")

    async def create_parsed_game(
        self,
        game_id: int,
        schema_version: int,
        raw_payload_gzip: bytes,
        game_data: dict,
        etag: str,
        session: Annotated[AsyncSession, Depends(get_db_session)],
    ) -> None:
        try:
            parsed_game = ParsedGame(
                game_id=game_id,
                schema_version=schema_version,
                raw_payload_gzip=raw_payload_gzip,
                game_data=game_data,
                etag=etag,
            )
            session.add(parsed_game)
            await session.commit()
            await session.refresh(parsed_game)
        except SQLAlchemyError as e:
            # Prefer DBAPI message if present; otherwise first arg or class name
            minimal = getattr(e, "orig", None)
            if minimal is None:
                minimal = e.args[0] if e.args else e.__class__.__name__
            logger.error("Create parsed game failed: %s", minimal)
