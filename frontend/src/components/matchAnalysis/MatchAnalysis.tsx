import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import Minimap from "./Minimap";
import PlayerCards from "./PlayerCards";
import ObjectiveInfoPanel from "./ObjectiveInfoPanel";
import { regions } from "../../data/Regions";
import { DestroyedObjective } from "../../types/DestroyedObjective";
import { GameAnalysisResponse, WORLD_BOUNDS } from "../../types/MatchAnalysis";
import { Hero, PlayerPosition } from "../../types/Player";
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
  },
};

const MatchAnalysis = () => {
  const { match_id } = useParams();
  // Fetch match analysis via ETag-aware hook
  const { data: matchAnalysisData } = useMatchAnalysis(Number(match_id));
  const matchAnalysis: GameAnalysisResponse =
    matchAnalysisData ?? defaultMatchAnalysis;
  const matchMetadata = matchAnalysis.match_metadata;
  const parsedGameData = matchAnalysis.parsed_game_data;
  const playersData = parsedGameData.players_data;
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
      hero: heroIdToHero[player.hero_id] || null,
    }));
  }, [playersData, heroData]);

  function scalePlayerPosition(playerPos: PlayerPosition): {
    scaledPlayerX: number;
    scaledPlayerY: number;
  } {
    // Scale the normalized position to (0, MAP_SIZE) range based on the overall min/max
    // This ensures that the player position is correctly represented on the minimap
    const spanX = Math.max(1e-6, WORLD_BOUNDS.xMax - WORLD_BOUNDS.xMin);
    const spanY = Math.max(1e-6, WORLD_BOUNDS.yMax - WORLD_BOUNDS.yMin);
    const scaledPlayerX = (playerPos.x - WORLD_BOUNDS.xMin) / spanX;
    const scaledPlayerY = 1 - (playerPos.y - WORLD_BOUNDS.yMin) / spanY;

    return { scaledPlayerX: scaledPlayerX, scaledPlayerY: scaledPlayerY };
  }

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
            {/* <div style={{ marginBottom: 0, padding: '0.5rem', background: '#fff', border: '1px solid #ccc', borderRadius: '6px', width: 180, alignSelf: 'flex-start' }}>
                <strong>Legend</strong>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, background: 'rgba(0,128,255,0.7)', borderRadius: '50%', marginRight: 8, border: '1px solid #0070c0' }}></span>
                  Team 0 Player
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, background: 'rgba(0,200,0,0.7)', borderRadius: '50%', marginRight: 8, border: '1px solid #008000' }}></span>
                  Team 1 Player
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, background: 'red', borderRadius: '50%', marginRight: 8, border: '1px solid #a00' }}></span>
                  Objective (Active)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, background: 'black', borderRadius: '50%', marginRight: 8, border: '1px solid #333' }}></span>
                  Objective (Destroyed)
                </div>
              </div> */}
            <ObjectiveInfoPanel
              destroyedObjectives={destroyedObjectivesSorted}
              currentObjectiveIndex={currentObjectiveIndex}
            />
            <PlayerCards
              playersData={players}
              per_player_data={matchAnalysis.parsed_game_data.per_player_data}
              // positions={
              //   matchAnalysis.parsed_game_data.per_player_data.positions
              // }
              currentTick={currentTick}
              scalePlayerPosition={scalePlayerPosition}
              gameData={matchAnalysis.parsed_game_data}
            />
          </div>
          <Minimap
            currentTick={currentTick}
            setCurrentTick={setCurrentTick}
            total_game_time_s={matchAnalysis.parsed_game_data.total_game_time_s}
            game_start_time_s={matchAnalysis.parsed_game_data.game_start_time_s}
            heroes={heroData}
            playersData={playersData}
            per_player_data={matchAnalysis.parsed_game_data.per_player_data}
            // playerPaths={playerPaths}
            destroyedObjectivesSorted={destroyedObjectivesSorted}
            setCurrentObjectiveIndex={setCurrentObjectiveIndex}
            regions={regions}
            scalePlayerPosition={scalePlayerPosition}
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
