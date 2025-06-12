import React, { useRef, useState, useEffect } from 'react';
import PerSecondTable from './PerSecondTable';
import AllPlayerPositions from './AllPlayerPositions';
import PerPlayerWindowTable from './PerPlayerWindowTable';
import MinimapPlayerPositions from './MinimapPlayerPositions';
import DamageEventsTable from './DamageEventsTable';
import DamageMatrixTable from './DamageMatrixTable';
import DamageSourceTypesTable from './DamageSourceTypesTable';
import { PlayerPath } from '../types/PlayerPath';
import { PlayerInfo } from '../types/PlayerInfo';
import { DestroyedObjective } from '../types/DestroyedObjective';
import { Hero } from '../types/Hero';
import MinimapObjectives from './MinimapObjectives';
import { objectiveCoordinates } from '../data/objectiveCoordinates';
import ObjectiveInfoPanel from './ObjectiveInfoPanel';
import PlayerCards from './PlayerCards';
import PlayerPositions from './PlayerPositions';

const MINIMAP_SIZE = 768;
const MINIMAP_URL = 'https://assets-bucket.deadlock-api.com/assets-api-res/images/maps/minimap.png';

interface MatchData {
  match_info: {
    duration_s: number;
    objectives: DestroyedObjective[],
    match_paths: {
      x_resolution: number;
      y_resolution: number;
      paths: Array<PlayerPath>;
    };
    damage_matrix: {
      sample_time_s: number[];
      source_details: {
        stat_type: number[];
        source_name: string[];
      };
      damage_dealers: {
        dealer_player_slot?: number;
        damage_sources: Array<Array<{
          source_details_index: number;
          damage_to_players: Array<{
            target_player_slot?: number;
            damage: Array<number>;
          }>;
        }>>;
      }[];
    }
    players: PlayerInfo[];
  };
}

interface ObjectiveCoordinate {
  label: string;
  x: number;
  y: number;
  team_id?: number;
  team_objective_id?: number;
}

const Minimap = () => {
  const mapRef = useRef<HTMLImageElement>(null);
  const [matchData, setMatchData] = useState<MatchData>({ match_info: { duration_s: 0, objectives: [], match_paths: { x_resolution: 0, y_resolution: 0, paths: [] }, damage_matrix: { sample_time_s: [], source_details: { stat_type: [], source_name: [] }, damage_dealers: []}, players: [] } });
  const [heroData, setHeroData] = useState<Hero[]>([{ id: 0, name: 'Yo Momma', images: {} }]);
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // x/yResolution comes from match_metadata response returned from
  // Deadlock API (https://api.deadlock-api.com/v1/matches/{match_id}/metadata)
  // and looks something like: "match_info": { "match_paths": "x_resolution": 16383, "y_resolution": 16383 }
  const xResolution = matchData.match_info.match_paths.x_resolution;
  const yResolution = matchData.match_info.match_paths.y_resolution;
  const playerPaths = matchData.match_info.match_paths.paths;

  const scaleToMinimap = (x: number, y: number): { left: number; top: number } => {
    const xOffset = -75;
    const left = x * MINIMAP_SIZE + xOffset; // Apply offset to x-coordinate
    const top = (1 - y) * MINIMAP_SIZE; // Invert y-axis for correct orientation
    return { left, top };
  };

  const renderObjectiveDot = (obj: ObjectiveCoordinate) => { return scaleToMinimap(obj.x, obj.y) };
  const renderPlayerDot = (x: number, y: number) => { return scaleToMinimap(x, y)};

  useEffect(() => {
    // fetch('/match_metadata.json')
    fetch('/match_metadataNew.json')
    // fetch('/match_metadataNew2.json')
      .then(res => res.json())
      .then(data => {
        console.log('Loaded match data:');
        setMatchData(data);
      })
      .catch(err => {
        console.error('Error fetching match data:', err)
        setError(true);
      });

    fetch('https://assets.deadlock-api.com/v2/heroes?only_active=true')
      .then(res => res.json())
      .then(data => {
        console.log('Loaded hero data:', data);
        setHeroData(data);
      })
      .catch(err => {
        console.error('Error fetching hero data:', err);
        setError(true);
      });
  }, []);

  // NOTE: NodeJS Timeout is used here for the repeat functionality, which is not ideal for React.
  // This is just testing out the PoC so it will be replaced with a more React-friendly solution later.
  const repeatRef = useRef<NodeJS.Timeout | null>(null);
  const repeatDirection = useRef<'left' | 'right' | null>(null);

  const startRepeat = (direction: 'left' | 'right') => {
    if (repeatRef.current) return;
    repeatDirection.current = direction;
    repeatRef.current = setInterval(() => {
      setCurrentTime(t => {
        if (direction === 'left') {
          if (t <= 0) return 0;
          return t - 1;
        } else {
          const maxTick = playerPaths[0]?.x_pos?.length ? playerPaths[0].x_pos.length - 1 : 0;
          if (t >= maxTick) return maxTick;
          return t + 1;
        }
      });
    }, 80);
  };

  const stopRepeat = () => {
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
      repeatDirection.current = null;
    }
  };

  // Prepare destroyed objectives: filter out those with destroyed_time_s === 0 and sort by destroyed_time_s
  // NOTE: Unsure where the objectives with destroyed_time_s === 0 come from, but they are not useful for
  // the minimap. It may be worth revisiting later.
  const destroyedObjectivesSorted = matchData.match_info.objectives
    .filter(obj => obj.destroyed_time_s !== 0)
    .sort((a, b) => a.destroyed_time_s - b.destroyed_time_s);
  const [currentObjectiveIndex, setCurrentObjectiveIndex] = useState(-1);
  const [activeObjectiveKey, setActiveObjectiveKey] = useState<string | null>(null);

  useEffect(() => {
    let lastActiveKey: string | null = null;
    let currentIdx = -1;
    destroyedObjectivesSorted.forEach((obj, idx) => {
      if (currentTime >= obj.destroyed_time_s) {
        lastActiveKey = `${obj.team}_${obj.team_objective_id}`;
        currentIdx = idx;
      }
    });
    setActiveObjectiveKey(lastActiveKey);
    setCurrentObjectiveIndex(currentIdx);
  }, [destroyedObjectivesSorted, currentTime]);

  return (
    <>
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
          <div style={{ marginBottom: 0, padding: '0.5rem', background: '#fff', border: '1px solid #ccc', borderRadius: '6px', width: 180, alignSelf: 'flex-start' }}>
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
          </div>
          <ObjectiveInfoPanel
            destroyedObjectives={destroyedObjectivesSorted}
            currentObjectiveIndex={currentObjectiveIndex}
          />
          {/* Player by-the-second data as cards */}
          <PlayerCards
            playerPaths={playerPaths}
            players={matchData.match_info.players}
            currentTime={currentTime}
            heros={heroData}
          />
        </div>
        {/* Minimap and slider */}
        <div title='MinimapPanel' style={{ position: 'absolute', right: 0, width: `${MINIMAP_SIZE}px`, height: `${MINIMAP_SIZE + 60}px`, flexShrink: 0, marginLeft: '24px', marginTop: '1rem', background: '#fafbfc', boxShadow: '-2px 0 8px rgba(0,0,0,0.07)' }}>
          <div
            style={{
              position: 'relative',
              width: `${MINIMAP_SIZE}px`,
              height: `${MINIMAP_SIZE}px`,
              pointerEvents: 'none',
            }}
          >
            <img
              ref={mapRef}
              src={MINIMAP_URL}
              alt="Minimap"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />
            <MinimapObjectives
              objectiveCoordinates={objectiveCoordinates}
              destroyedObjectives={destroyedObjectivesSorted}
              currentTime={currentTime}
              renderObjectiveDot={renderObjectiveDot}
              activeObjectiveKey={activeObjectiveKey}
            />
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#f7f7f7', padding: '8px 0', borderTop: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button
              onClick={() => setCurrentTime(t => Math.max(0, t - 1))}
              onMouseDown={() => startRepeat('left')}
              onMouseUp={stopRepeat}
              onMouseLeave={stopRepeat}
              onTouchStart={() => startRepeat('left')}
              onTouchEnd={stopRepeat}
              disabled={currentTime <= 0}
              style={{ padding: '2px 10px', fontSize: '1.2em', borderRadius: 4, border: '1px solid #bbb', background: currentTime <= 0 ? '#eee' : '#fff', cursor: currentTime <= 0 ? 'not-allowed' : 'pointer' }}
              aria-label="Previous Tick"
            >
              ◀
            </button>
            <input
              type="range"
              min={0}
              max={playerPaths[0]?.x_pos?.length ? playerPaths[0].x_pos.length - 1 : 0}
              value={currentTime}
              onChange={e => setCurrentTime(Number(e.target.value))}
              style={{ width: '70%' }}
            />
            <button
              onClick={() => setCurrentTime(t => Math.min((playerPaths[0]?.x_pos?.length || 1) - 1, t + 1))}
              onMouseDown={() => startRepeat('right')}
              onMouseUp={stopRepeat}
              onMouseLeave={stopRepeat}
              onTouchStart={() => startRepeat('right')}
              onTouchEnd={stopRepeat}
              disabled={currentTime >= ((playerPaths[0]?.x_pos?.length || 1) - 1)}
              style={{ padding: '2px 10px', fontSize: '1.2em', borderRadius: 4, border: '1px solid #bbb', background: currentTime >= ((playerPaths[0]?.x_pos?.length || 1) - 1) ? '#eee' : '#fff', cursor: currentTime >= ((playerPaths[0]?.x_pos?.length || 1) - 1) ? 'not-allowed' : 'pointer' }}
              aria-label="Next Tick"
            >
              ▶
            </button>
            <span style={{ marginLeft: 8 }}>Tick: {currentTime}</span>
          </div>
          {/* Player positions at currentTime */}
          <PlayerPositions
            playerPaths={playerPaths}
            players={matchData.match_info.players}
            currentTime={currentTime}
            xResolution={xResolution}
            yResolution={yResolution}
            heros={heroData}
            renderPlayerDot={renderPlayerDot}
            getPlayerMinimapPosition={getPlayerMinimapPosition}
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

// Utility function to map player position to minimap coordinates
export function getPlayerMinimapPosition({
  player,
  playerX,
  playerY,
  playerPaths,
  xResolution,
  yResolution,
  renderPlayerDot,
}: {
  player: any;
  playerX: number;
  playerY: number;
  playerPaths: Array<PlayerPath>;
  xResolution: number;
  yResolution: number;
  renderPlayerDot: (x: number, y: number) => { left: number; top: number };
}) {
  const normPlayerX = player.x_min + (playerX / xResolution) * (player.x_max - player.x_min);
  const normPlayerY = player.y_min + (playerY / yResolution) * (player.y_max - player.y_min);

  const allPlayerXMin = Math.min(...playerPaths.map((p: PlayerPath) => p.x_min));
  const allPlayerXMax = Math.max(...playerPaths.map((p: PlayerPath) => p.x_max));
  const allPlayerYMin = Math.min(...playerPaths.map((p: PlayerPath) => p.y_min));
  const allPlayerYMax = Math.max(...playerPaths.map((p: PlayerPath) => p.y_max));

  const scaledPlayerX = ((normPlayerX - allPlayerXMin) / (allPlayerXMax - allPlayerXMin));
  const scaledPlayerY = ((normPlayerY - allPlayerYMin) / (allPlayerYMax - allPlayerYMin));

  return renderPlayerDot(scaledPlayerX, scaledPlayerY);
}

export default Minimap;
