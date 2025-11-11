import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import Minimap from "./Minimap";
import PlayerCards from "./PlayerCards";
import ObjectiveInfoPanel from "./ObjectiveInfoPanel";
import { regions } from "../../data/regions";
import { DestroyedObjective } from "../../types/DestroyedObjective";
import { GameAnalysisResponse, WORLD_BOUNDS } from "../../types/MatchAnalysis";
import { Hero } from "../../types/Player";
import { ScaledBossSnapshot } from "../../types/Boss";
import { useMatchAnalysis } from "../../hooks/UseMatchAnalysis";
import PrintHeroImageData from "./PrintHeroImageData";
import { formatSecondstoMMSS } from "../../utils/time";

const defaultMatchAnalysis: GameAnalysisResponse = {
  // NOTE: match references here are because it's coming from the Deadlock API.
  // Parsed game data refers to these as "games"
  match_metadata: {
    match_info: {
      duration_s: 0,
      match_outcome: 0,
      winning_team: 0,
      players: [],
      start_time: 0,
      match_id: 0,
      legacy_objectives_mask: null,
      game_mode: 0,
      match_mode: 0,
      objectives: [],
      damage_matrix: {
        sample_time_s: [],
        source_details: {
          stat_type: [],
          source_name: [],
        },
        damage_dealers: [],
      },
      match_pauses: [],
      customer_user_stats: undefined,
      watched_death_replays: [],
      objectives_mark_team0: undefined,
      objectives_mark_team1: undefined,
      mid_boss: [],
      is_high_skill_range_parties: false,
      low_pri_pool: false,
      new_player_pool: false,
      average_badge_team0: 0,
      average_badge_team1: 0,
      game_mode_version: 0,
    },
  },
  parsed_game_data: {
    total_game_time_s: 0,
    game_start_time_s: 0,
    players_data: [],
    per_player_data: {},
    bosses: {
      snapshots: [],
      health_timeline: [],
    },
  },
};

const MINIMAP_SIZE = 768;
// FIXME: Use this value once we're confident in how our map
// looks at bigger sizes.
// const MINIMAP_SIZE = 512;

// Coordinate transformation functions
const normalizePosition = (x: number, y: number) => {
  const { xMin, xMax, yMin, yMax } = WORLD_BOUNDS;
  const spanX = Math.max(1e-6, xMax - xMin);
  const spanY = Math.max(1e-6, yMax - yMin);
  const normX = (x - xMin) / spanX;
  // Invert Y axis for minimap representation
  const normY = 1 - (y - yMin) / spanY;

  return { normX, normY };
};

const normToScaledPixels = (normX: number, normY: number) => {
  const xOffset = -10;
  const left = normX * MINIMAP_SIZE + xOffset; // Apply offset to x-coordinate
  const top = normY * MINIMAP_SIZE;
  return { left, top };
};

const worldToMinimapPixels = (x: number, y: number) => {
  const { normX, normY } = normalizePosition(x, y);
  return normToScaledPixels(normX, normY);
};

const MatchAnalysis = () => {
  const { match_id } = useParams();
  // Fetch match analysis via ETag-aware hook
  const { data: matchAnalysisData } = useMatchAnalysis(Number(match_id));
  const matchAnalysis: GameAnalysisResponse =
    matchAnalysisData ?? defaultMatchAnalysis;
  // FIXME: matchMetadata is Deadlock API stuff that we'll likely get rid of later
  const matchMetadata = matchAnalysis.match_metadata;
  const parsedGameData = matchAnalysis.parsed_game_data;
  const bossSnapshots = parsedGameData.bosses.snapshots;
  // NOTE: Contains player info
  const playersData = parsedGameData.players_data;
  // NOTE: Contains dmg/position data per player
  const perPlayerData = parsedGameData.per_player_data;
  const [heroData, setHeroData] = useState<Hero[]>([
    { id: 0, name: "Default", images: {} },
  ]);
  const [error, setError] = useState(false);
  const isMounted = useRef(false);

  const [currentTick, setCurrentTick] = useState<number>(0);
  const matchTime = formatSecondstoMMSS(currentTick);

  // Prepare destroyed objectives: filter out those with destroyed_time_s === 0 and sort by destroyed_time_s
  // NOTE: Unsure where the objectives with destroyed_time_s === 0 come from, but they are not useful for
  // the minimap. It may be worth revisiting later.
  const destroyedObjectivesSorted: Array<DestroyedObjective> =
    matchMetadata.match_info.objectives
      .filter((obj) => obj.destroyed_time_s !== 0)
      .sort((a, b) => a.destroyed_time_s - b.destroyed_time_s);
  const [currentObjectiveIndex, setCurrentObjectiveIndex] = useState(-1);

  const players = useMemo(() => {
    if (!playersData || !heroData) return [];
    const heroIdToHero: Record<number, Hero> = {};
    heroData.forEach((h) => {
      heroIdToHero[h.id] = h;
    });
    return playersData.map((player) => ({
      ...player,
      hero: heroIdToHero[player.hero_id] || {
        id: 0,
        name: "Unknown",
        images: {},
      },
    }));
  }, [playersData, heroData]);

  const scaledPlayerCoords = useMemo(() => {
    return Object.entries(perPlayerData).map(([customId, playerGameData]) => {
      const pos = playerGameData.positions[currentTick];
      const playerData = players.find(
        (p) => p.lobby_player_slot === Number(customId)
      );

      // Return default [0,0] coordinates if position or player data is missing
      if (!pos || !playerData) {
        return {
          playerId: customId,
          left: 0,
          top: 0,
          team: playerData?.team ?? 0,
          hero: playerData?.hero ?? { id: 0, name: "Unknown", images: {} },
        };
      }

      const { left, top } = worldToMinimapPixels(pos.x, pos.y);
      return {
        playerId: customId,
        left,
        top,
        team: playerData.team,
        hero: playerData.hero,
      };
    });
  }, [perPlayerData, players, currentTick]);

  const scaledBossSnapshots: ScaledBossSnapshot[] = useMemo(
    () =>
      bossSnapshots.map((snapshot) => ({
        ...snapshot,
        ...worldToMinimapPixels(snapshot.x, snapshot.y),
      })),
    [bossSnapshots]
  );

  useEffect(() => {
    isMounted.current = true;

    fetch("https://assets.deadlock-api.com/v2/heroes?only_active=true")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted.current) return;
        console.log("Loaded hero data:", data);
        setHeroData(data);
      })
      .catch((err) => {
        if (!isMounted.current) return;
        console.error("Error fetching hero data:", err);
        setError(true);
      });

    return () => {
      isMounted.current = false;
    };
  }, [match_id]);

  return (
    <>
      <div className='match-analysis'>
        <div className='w-full bg-white/80'>
          <div className='mx-auto flex max-w-screen-lg flex-col items-center gap-1 py-4 text-center'>
            <h1>Match Stats</h1>
            <h2>Match ID: {match_id}</h2>
            <h3>Match Time: {matchTime}</h3>
          </div>
        </div>
        <div className='grid grid-cols-[1fr_47vw] gap-3'>
          <div
            title='InformationPanel'
            className='box-border gap-2 border-2 border-black bg-gray-300'
          >
            <ObjectiveInfoPanel
              destroyedObjectives={destroyedObjectivesSorted}
              currentObjectiveIndex={currentObjectiveIndex}
            />
            <PlayerCards
              playersData={players}
              perPlayerData={perPlayerData}
              currentTick={currentTick}
              normalizePosition={normalizePosition}
              gameData={matchAnalysis.parsed_game_data}
            />
          </div>
          <Minimap
            currentTick={currentTick}
            setCurrentTick={setCurrentTick}
            total_game_time_s={matchAnalysis.parsed_game_data.total_game_time_s}
            game_start_time_s={matchAnalysis.parsed_game_data.game_start_time_s}
            MINIMAP_SIZE={MINIMAP_SIZE}
            scaledBossSnapshots={scaledBossSnapshots}
            scaledPlayerCoords={scaledPlayerCoords}
            destroyedObjectivesSorted={destroyedObjectivesSorted}
            setCurrentObjectiveIndex={setCurrentObjectiveIndex}
            regions={regions}
          />
        </div>
      </div>

      {/* Player combat type/health Table */}
      {/*
          The buttons that control the time windows has been removed, but I may have use for some of the
          code in here so I'm keeping it for now
        */}
      {/* <PerPlayerWindowTable
          playerPaths={playerPaths}
          matchMetadata={matchMetadata}
          playerTime={playerTime}
          heros={heros}
        /> */}

      {/* Damage Source Types Table */}
      {/* <DamageSourceTypesTable
          sourceDetails={matchMetadata.match_info.damage_matrix.source_details}
        /> */}

      {/* Digestible Damage Matrix Table for Abrams (player_slot 1) */}
      {/* <DamageMatrixTable matchMetadata={matchMetadata} /> */}

      <PrintHeroImageData heroData={heroData} />
    </>
  );
};

export default MatchAnalysis;
