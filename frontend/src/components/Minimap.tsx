import React, { useRef, useState, useEffect } from 'react';
import PerSecondTable from './PerSecondTable';
import AllPlayerPositions from './AllPlayerPositions';
import PerPlayerWindowTable from './PerPlayerWindowTable';
import DamageEventsTable from './DamageEventsTable';
import DamageMatrixTable from './DamageMatrixTable';
import DamageSourceTypesTable from './DamageSourceTypesTable';
import { PlayerPath } from '../types/PlayerPath';
import { PlayerInfo } from '../types/PlayerInfo';
import { DestroyedObjective } from '../types/DestroyedObjective';
import { Hero } from '../types/Hero';
import Objectives from './Objectives';
import { objectiveCoordinates } from '../data/objectiveCoordinates';
import ObjectiveInfoPanel from './ObjectiveInfoPanel';
import PlayerCards from './PlayerCards';
import PlayerPositions from './PlayerPositions';
import Grid from './Grid';
import RegionsMapping from './RegionsMapping';
import { regions } from '../data/Regions';
import RegionToggle from './RegionToggle';
import GameTimeViewer from './GameTimeViewer';
import { standardizePlayerPosition } from '../components/PlayerPositions';

var pointInPolygon = require('point-in-polygon')

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
    const top = y * MINIMAP_SIZE;
    return { left, top };
  };

  // TODO: Not a fan of inverting the y-axis here. Can probably find a better place to do it.
  const renderObjectiveDot = (obj: ObjectiveCoordinate) => { return scaleToMinimap(obj.x, 1 - obj.y) };
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

  function getPlayerRegionLabels(x_max: number, x_min: number, y_max: number, y_min: number, x: number, y: number, debug: boolean = false): string[] {
    const foundRegions: string[] = regions.filter(region => isPlayerInRegion(
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

  const [visibleRegions, setVisibleRegions] = useState<{ [label: string]: boolean }>(
    () => Object.fromEntries(regions.map(r => [r.label, true]))
  );
  const handleRegionToggle = (label: string) => {
    setVisibleRegions(v => ({ ...v, [label]: !v[label] }));
  };

  const visibleRegionList = regions.filter(r => visibleRegions[r.label]);

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
          <PlayerCards
            playerPaths={playerPaths}
            players={matchData.match_info.players}
            currentTime={currentTime}
            heros={heroData}
            getPlayerRegionLabels={getPlayerRegionLabels}
          />
        </div>
        {/* Minimap and slider */}
        <div title='MinimapPanel' style={{ position: 'absolute', right: 0, width: `${MINIMAP_SIZE}px`, flexShrink: 0, marginLeft: '24px', marginTop: '1rem', background: '#fafbfc', boxShadow: '-2px 0 8px rgba(0,0,0,0.07)' }}>
          <div
            style={{
              position: 'relative',
              width: `${MINIMAP_SIZE}px`,
              height: `${MINIMAP_SIZE}px`,
              pointerEvents: 'none',
            }}
          >
            <Grid MINIMAP_SIZE={MINIMAP_SIZE} />
            <RegionsMapping MINIMAP_SIZE={MINIMAP_SIZE} regions={visibleRegionList} />
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
            <Objectives
              objectiveCoordinates={objectiveCoordinates}
              destroyedObjectives={destroyedObjectivesSorted}
              currentTime={currentTime}
              renderObjectiveDot={renderObjectiveDot}
              activeObjectiveKey={activeObjectiveKey}
            />
          </div>
          <PlayerPositions
            playerPaths={playerPaths}
            players={matchData.match_info.players}
            currentTime={currentTime}
            xResolution={xResolution}
            yResolution={yResolution}
            heros={heroData}
            renderPlayerDot={renderPlayerDot}
          />
          <div style={{ width: '100%', background: '#f7f7f7', borderTop: '1px solid #ccc', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0 }}>
            <GameTimeViewer
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              maxTime={playerPaths[0]?.x_pos?.length ? playerPaths[0].x_pos.length - 1 : 0}
              startRepeat={startRepeat}
              stopRepeat={stopRepeat}
            />
            <RegionToggle
              regions={regions}
              visibleRegions={visibleRegions}
              onToggle={handleRegionToggle}
            />
          </div>
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

export default Minimap;
