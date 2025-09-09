import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import pointInPolygon from "point-in-polygon";
import Minimap from "./Minimap";
import PlayerCards from "./PlayerCards";
import ObjectiveInfoPanel from "./ObjectiveInfoPanel";
import { standardizePlayerPosition } from "./PlayerPositions";
import { Region } from "../../types/Region";
import { regions } from "../../data/Regions";
import { DestroyedObjective } from "../../types/DestroyedObjective";
import { MatchAnalysisResponse } from "../../types/MatchAnalysis";
import { NPC, Hero } from "../../types/Player";
import { useMatchAnalysis } from "../../hooks/UseMatchAnalysis";
import PrintHeroImageData from "./PrintHeroImageData";

const defaultMatchAnalysis: MatchAnalysisResponse = {
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
      match_paths: {
        x_resolution: 0,
        y_resolution: 0,
        paths: [],
      },
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
    damage_per_tick: [] as [],
    players: [],
  },
  players: [],
  npcs: [],
};

const MatchAnalysis = () => {
  const { match_id } = useParams();
  // Fetch match analysis via ETag-aware hook
  const { data: matchAnalysisData } = useMatchAnalysis(Number(match_id));
  const matchAnalysis: MatchAnalysisResponse =
    matchAnalysisData ?? defaultMatchAnalysis;
  const matchMetadata = matchAnalysis.match_metadata;
  const [heroData, setHeroData] = useState<Hero[]>([
    { id: 0, name: "Default", images: {} },
  ]);
  const [error, setError] = useState(false);
  const isMounted = useRef(false);

  const [currentTick, setCurrentTick] = useState<number>(0);
  const minutes = Math.floor(Number(currentTick) / 60);
  const seconds = Math.floor(Number(currentTick) % 60);
  const matchTime = `${minutes}:${String(seconds).padStart(2, "0")}`;

  // Prepare destroyed objectives: filter out those with destroyed_time_s === 0 and sort by destroyed_time_s
  // NOTE: Unsure where the objectives with destroyed_time_s === 0 come from, but they are not useful for
  // the minimap. It may be worth revisiting later.
  const destroyedObjectivesSorted: Array<DestroyedObjective> =
    matchMetadata.match_info.objectives
      .filter((obj) => obj.destroyed_time_s !== 0)
      .sort((a, b) => a.destroyed_time_s - b.destroyed_time_s);
  const [currentObjectiveIndex, setCurrentObjectiveIndex] = useState(-1);

  // x/yResolution comes from match_metadata response returned from
  // Deadlock API (https://api.deadlock-api.com/v1/matches/{match_id}/metadata)
  // and looks something like: "match_info": { "match_paths": "x_resolution": 16383, "y_resolution": 16383 }
  const playerPaths = matchMetadata.match_info.match_paths.paths;
  const xResolution = matchMetadata.match_info.match_paths.x_resolution;
  const yResolution = matchMetadata.match_info.match_paths.y_resolution;
  const players_metadata = matchMetadata.match_info.players;

  function getPlayerRegionLabels(
    x_max: number,
    x_min: number,
    y_max: number,
    y_min: number,
    x: number,
    y: number,
    debug: boolean = false
  ): string[] {
    const foundRegions: string[] = regions
      .filter((region: Region) =>
        isPlayerInRegion(
          x_max,
          x_min,
          y_max,
          y_min,
          [x, y],
          region.polygon,
          xResolution,
          yResolution
        )
      )
      .map<string>((region): string => {
        return region.label ? region.label : "None";
      });
    return foundRegions;
  }

  function isPlayerInRegion(
    x_max: number,
    x_min: number,
    y_max: number,
    y_min: number,
    point: [number, number],
    polygon: [number, number][],
    xResolution: number,
    yResolution: number
  ): boolean {
    const [playerX, playerY] = point;
    const { standPlayerX, standPlayerY } = standardizePlayerPosition(
      x_max,
      x_min,
      y_max,
      y_min,
      playerX,
      playerY,
      playerPaths,
      xResolution,
      yResolution
    );

    return pointInPolygon([standPlayerX, standPlayerY], polygon);
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

  const players = useMemo(() => {
    if (!matchAnalysis.players || !heroData) return [];
    const heroIdToHero: Record<number, Hero> = {};
    heroData.forEach((h) => {
      heroIdToHero[h.id] = h;
    });
    return matchAnalysis.players.map((player) => ({
      ...player,
      hero: heroIdToHero[player.player_info.hero_id] || null,
    }));
  }, [matchAnalysis.players, heroData]);

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
              players={players}
              npcs={matchAnalysis.npcs as NPC[]}
              currentTick={currentTick}
              getPlayerRegionLabels={getPlayerRegionLabels}
              gameData={matchAnalysis.parsed_game_data}
            />
          </div>
          <Minimap
            currentTick={currentTick}
            setCurrentTick={setCurrentTick}
            heroes={heroData}
            players={players_metadata}
            playerPaths={playerPaths}
            destroyedObjectivesSorted={destroyedObjectivesSorted}
            setCurrentObjectiveIndex={setCurrentObjectiveIndex}
            regions={regions}
            xResolution={xResolution}
            yResolution={yResolution}
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
