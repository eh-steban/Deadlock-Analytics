import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Minimap from './Minimap';
import PlayerCards from './PlayerCards';
import ObjectiveInfoPanel from './ObjectiveInfoPanel';
import { standardizePlayerPosition } from './PlayerPositions';
import { Region } from '../../types/Region';
import { regions } from '../../data/Regions';
import { MatchMetadata } from '../../types/MatchMetadata';
import { DestroyedObjective } from '../../types/DestroyedObjective';
import { MatchAnalysisResponse } from '../../types/MatchAnalysis';
import { NPC, Hero } from '../../types/Player';

var pointInPolygon = require('point-in-polygon')

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
  npcs: {},
};

const MatchAnalysis = () => {
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysisResponse>(defaultMatchAnalysis);
  const [matchData, setMatchMetadata] = useState<MatchMetadata>(defaultMatchAnalysis.match_metadata);
  const [heroData, setHeroData] = useState<Hero[]>([{ id: 0, name: 'Default', images: {} }]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [npcs, setNPCs] = useState<NPC[]>([]);
  const [error, setError] = useState(false);
  const { match_id } = useParams();
  const isMounted = useRef(false);

  // Prepare destroyed objectives: filter out those with destroyed_time_s === 0 and sort by destroyed_time_s
  // NOTE: Unsure where the objectives with destroyed_time_s === 0 come from, but they are not useful for
  // the minimap. It may be worth revisiting later.
  const destroyedObjectivesSorted: Array<DestroyedObjective> = matchData.match_info.objectives
    .filter(obj => obj.destroyed_time_s !== 0)
    .sort((a, b) => a.destroyed_time_s - b.destroyed_time_s);
  const [currentObjectiveIndex, setCurrentObjectiveIndex] = useState(-1);

  // x/yResolution comes from match_metadata response returned from
  // Deadlock API (https://api.deadlock-api.com/v1/matches/{match_id}/metadata)
  // and looks something like: "match_info": { "match_paths": "x_resolution": 16383, "y_resolution": 16383 }
  const playerPaths = matchData.match_info.match_paths.paths;
  const xResolution = matchData.match_info.match_paths.x_resolution;
  const yResolution = matchData.match_info.match_paths.y_resolution;
  const players_metadata = matchData.match_info.players;

  function getPlayerRegionLabels(x_max: number, x_min: number, y_max: number, y_min: number, x: number, y: number, debug: boolean = false): string[] {
    const foundRegions: string[] = regions.filter((region: Region) => isPlayerInRegion(
      x_max,
      x_min,
      y_max,
      y_min,
      [x, y],
      region.polygon,
      xResolution,
      yResolution,
    )).map<string>((region): string => { return region.label ? region.label : 'None' });
    return foundRegions;
  };

  function isPlayerInRegion(
    x_max: number,
    x_min: number,
    y_max: number,
    y_min: number,
    point: [number, number],
    polygon: [number, number][],
    xResolution: number,
    yResolution: number,
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
        yResolution,
      );

      return pointInPolygon([standPlayerX, standPlayerY], polygon);
  };

  useEffect(() => {
    isMounted.current = true;

    fetch(`http://${process.env.REACT_APP_BACKEND_DOMAIN}/match/analysis/${match_id}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted.current) return;
        console.log('Loaded match data from backend:', data);
        setMatchAnalysis(data);
        setNPCs(data.npcs);
        setMatchMetadata(data.match_metadata);
      })
      .catch(err => {
        if (!isMounted.current) return;
        console.error('Error fetching match data from backend:', err);
        setError(true);
      });

    fetch('https://assets.deadlock-api.com/v2/heroes?only_active=true')
      .then(res => res.json())
      .then(data => {
        if (!isMounted.current) return;
        console.log('Loaded hero data:', data);
        setHeroData(data);
      })
      .catch(err => {
        if (!isMounted.current) return;
        console.error('Error fetching hero data:', err);
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
      <h1>Deadlock Minimap</h1>
      <h3>Match ID: {match_id}</h3>
      <div style={{ width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
        <div
          title='InformationPanel'
          style={{
            width: '45vw',
            padding: '1rem',
            backgroundColor: '#f0f0f0',
            borderRight: '1px solid #ddd',
            height: '100vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <h3>Current Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</h3>
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
            npcs={npcs}
            currentTime={currentTime}
            getPlayerRegionLabels={getPlayerRegionLabels}
            gameData={matchAnalysis.parsed_game_data}
          />
        </div>
        <Minimap
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
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

      {/* Player combat type/health Table */}
      {/*
        The buttons that control the time windows has been removed, but I may have use for some of the
        code in here so I'm keeping it for now
      */}
      {/* <PerPlayerWindowTable
        playerPaths={playerPaths}
        matchData={matchData}
        playerTime={playerTime}
        heros={heros}
      /> */}

      {/* Damage Source Types Table */}
      {/* <DamageSourceTypesTable
        sourceDetails={matchData.match_info.damage_matrix.source_details}
      /> */}

      {/* Digestible Damage Matrix Table for Abrams (player_slot 1) */}
      {/* <DamageMatrixTable matchData={matchData} /> */}

      <div style={{ marginTop: 40 }}>
        <h3>All Hero Images (from API)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {heroData.map(hero => (
            <div key={hero.id} style={{ minWidth: 200, marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{hero.name}</div>
              {hero.images && Object.entries(hero.images).map(([label, url]) => (
                <div key={label} style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: '0.95em', color: '#888', marginRight: 8 }}>{label}:</span>
                  <img src={url} alt={label} style={{ maxWidth: 120, maxHeight: 80, verticalAlign: 'middle', border: '1px solid #ccc', borderRadius: 4, background: '#fff' }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MatchAnalysis;
