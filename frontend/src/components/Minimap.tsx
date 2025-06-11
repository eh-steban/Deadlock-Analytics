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
import MinimapObjectives from './MinimapObjectives';
import { objectiveCoordinates } from '../data/objectiveCoordinates';
import ObjectiveInfoPanel from './ObjectiveInfoPanel';

const MINIMAP_SIZE = 768;
const MINIMAP_URL = 'https://assets-bucket.deadlock-api.com/assets-api-res/images/maps/minimap.png';
const heros: { [key: number]: string } = {'1': 'Infernus', '2': 'Seven', '3': 'Vindicta', '4': 'Lady Geist', '6': 'Abrams', '7': 'Wraith', '8': 'McGinnis', '10': 'Paradox', '11': 'Dynamo', '12': 'Kelvin', '13': 'Haze', '14': 'Holliday', '15': 'Bebop', '16': 'Calico', '17': 'Grey Talon', '18': 'Mo & Krill', '19': 'Shiv', '20': 'Ivy', '25': 'Warden', '27': 'Yamato', '31': 'Lash', '35': 'Viscous', '48': 'Wrecker', '50': 'Pocket', '52': 'Mirage', '53': 'Fathom', '58': 'Vyper', '60': 'Sinclair', '61': 'Trapper', '62': 'Raven'};
const HEROS_URL = 'https://assets.deadlock-api.com/v2/heroes?only_active=true';

interface Hero {
  name: string;
}

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

enum StatType {
  Damage = 0,
  Healing = 1,
  HealPrevented = 2,
  Mitigated = 3,
  LethalDamage = 4,
  Regen = 5
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
  const [heroData, setHeroData] = useState<Hero[]>([{name: 'Yo Momma'}]);
  const [error, setError] = useState(false);
  const [currentObjectiveIndex, setCurrentObjectiveIndex] = useState(-1);
  const [activeObjectiveKey, setActiveObjectiveKey] = useState<string | null>(null);

  // x/yResolution comes from match_metadata response returned from
  // Deadlock API (https://api.deadlock-api.com/v1/matches/{match_id}/metadata)
  // and looks something like: "match_info": { "match_paths": "x_resolution": 16383, "y_resolution": 16383 }
  const xResolution = matchData.match_info.match_paths.x_resolution;
  const yResolution = matchData.match_info.match_paths.y_resolution;

  const scaleToMinimap = (x: number, y: number): { left: number; top: number } => {
    const xOffset = -75;
    const left = x * MINIMAP_SIZE + xOffset; // Apply offset to x-coordinate
    const top = (1 - y) * MINIMAP_SIZE; // Invert y-axis for correct orientation
    return { left, top };
  };

  const renderObjectiveDot = (obj: ObjectiveCoordinate) => { return scaleToMinimap(obj.x, obj.y) };
  const renderPlayerDot = (x: number, y: number) => { return scaleToMinimap(x, y)};

  const destroyedObjectives = [...matchData.match_info.objectives].filter(obj => obj.destroyed_time_s !== 0).sort((a, b) => a.destroyed_time_s - b.destroyed_time_s);
  const currentTime = destroyedObjectives[currentObjectiveIndex]?.destroyed_time_s || 10;
  const [playerTime, setPlayerTime] = useState(0);
  const playerPaths = matchData.match_info.match_paths.paths;

  const updateActiveObjective = (index: number) => {
    const obj = destroyedObjectives[index];
    const match = objectiveCoordinates.find(coord =>
      coord.team_id === Number(obj.team) &&
      coord.team_objective_id === Number(obj.team_objective_id)
    );
    if (match) {
      setCurrentObjectiveIndex(index);
      setActiveObjectiveKey(`${match.team_id}_${match.team_objective_id}`);
    }
  };

  const handleNext = () => {
    const nextIndex = currentObjectiveIndex + 1;
    if (nextIndex >= destroyedObjectives.length) return;
    updateActiveObjective(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = currentObjectiveIndex - 1;
    if (prevIndex < 0) {
      setCurrentObjectiveIndex(-1);
      setActiveObjectiveKey(null);
      return;
    }
    updateActiveObjective(prevIndex);
  };

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

    fetch(HEROS_URL)
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

  return (
    <>
      {/* Per-Second Data Table for player_slot 1 (Abrams) */}
      <PerSecondTable playerPaths={playerPaths} />

      {/* Damage Events Table (60s Window, by sample_time_s) */}
      {/* <DamageEventsTable matchData={matchData} heros={heros} /> */}

      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <ObjectiveInfoPanel
          destroyedObjectives={destroyedObjectives}
          currentObjectiveIndex={currentObjectiveIndex}
        />
        <div style={{ position: 'relative', width: `${MINIMAP_SIZE}px`, height: `${MINIMAP_SIZE}px` }}>
          <img ref={mapRef} src={MINIMAP_URL} alt="Minimap" style={{ width: '100%' }} />
          <button onClick={handlePrevious} style={{ margin: '0.5rem' }}>Previous</button>
          <button onClick={handleNext} style={{ margin: '0.5rem' }}>Next</button>
          <button onClick={() => setPlayerTime(t => Math.max(0, t - 60))}>Player Time -</button>
          <button onClick={() => setPlayerTime(t => t + 60)}>Player Time +</button>
          <span>Player Time: {playerTime}s</span>

          <MinimapObjectives
            objectiveCoordinates={objectiveCoordinates}
            destroyedObjectives={destroyedObjectives}
            currentTime={currentTime}
            activeObjectiveKey={activeObjectiveKey}
            renderObjectiveDot={renderObjectiveDot}
          />

          {/* Map all player positions on both teams for a match */}
          {/* <AllPlayerPositions
            playerPaths={playerPaths}
            matchData={matchData}
            xResolution={xResolution}
            yResolution={yResolution}
            renderPlayerDot={renderPlayerDot}
          /> */}

          {/* Map all player positions on both teams at the time of an objective being destroyed */}
          <MinimapPlayerPositions
            playerPaths={playerPaths}
            matchData={matchData}
            currentTime={currentTime}
            xResolution={xResolution}
            yResolution={yResolution}
            renderPlayerDot={renderPlayerDot}
          />
        </div>
      </div>

      {/* Player combat type/health Table */}
      <PerPlayerWindowTable
        playerPaths={playerPaths}
        matchData={matchData}
        playerTime={playerTime}
        heros={heros}
      />

      {/* Damage Source Types Table */}
      <DamageSourceTypesTable
        statType={StatType}
        sourceDetails={matchData.match_info.damage_matrix.source_details}
      />

      {/* Digestible Damage Matrix Table for Abrams (player_slot 1) */}
      {/* <DamageMatrixTable matchData={matchData} StatType={StatType} /> */}
    </>
  );
};

export default Minimap;
