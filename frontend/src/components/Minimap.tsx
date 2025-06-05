import React, { useRef, useState, useEffect } from 'react';

const MINIMAP_SIZE = 768;
const MINIMAP_URL = 'https://assets-bucket.deadlock-api.com/assets-api-res/images/maps/minimap.png';

interface PlayerInfo {
  account_id: number;
  player_slot: number;
  team: number;
  // ...other properties as needed
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
    players: PlayerInfo[];
  };
}

interface DestroyedObjective {
  team: string; // team is an ID stored as a string in the format "0" or "1"
  team_objective_id: string;
  destroyed_time_s: number;
  creep_damage: number;
  creep_damage_mitigated: number;
  player_damage: number;
  player_damage_mitigated: number;
  first_damage_time_s: number;
}

interface PlayerPath {
  player_slot: number;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  x_pos: Array<number>;
  y_pos: Array<number>;
  health: Array<number>;
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
  const [matchData, setMatchData] = useState<MatchData>({ match_info: { duration_s: 0, objectives: [], match_paths: { x_resolution: 0, y_resolution: 0, paths: [] }, players: [] } });
  const [error, setError] = useState(false);
  const [currentObjectiveIndex, setCurrentObjectiveIndex] = useState(-1);
  const [activeObjectiveKey, setActiveObjectiveKey] = useState<string | null>(null);

  // x/yResolution comes from match_metadata response returned from
  // Deadlock API (https://api.deadlock-api.com/v1/matches/{match_id}/metadata)
  // and looks something like: "match_info": { "match_paths": "x_resolution": 16383, "y_resolution": 16383 }
  const xResolution = matchData.match_info.match_paths.x_resolution;
  const yResolution = matchData.match_info.match_paths.y_resolution;

  const scaleToMinimap = (x: number, y: number): { left: number; top: number } => {
    const left = x * MINIMAP_SIZE;
    const top = (1 - y) * MINIMAP_SIZE; // Invert y-axis for correct orientation
    return { left, top };
  };

  const renderObjectiveDot = (obj: ObjectiveCoordinate) => { return scaleToMinimap(obj.x, obj.y) };
  const renderPlayerDot = (x: number, y: number) => { return scaleToMinimap(x, y) };

  const objectiveCoordinates: ObjectiveCoordinate[] = [
    { label: 'Midboss', x: 0.5, y: 0.5 },

    // Team 0 Objectives
    // NOTE: The labels are a combination of a couple of message types listed in the protos here:
    // https://github.com/SteamDatabase/Protobufs/blob/ad608d0b059c4f58a12abb621cb729bed999fa02/deadlock/citadel_gcmessages_common.proto
    { team_id: 0, team_objective_id: 0, label: 'k_eCitadelTeamObjective_Core', x: 0.5, y: 0.13 },
    { team_id: 0, team_objective_id: 9, label: 'k_eCitadelTeamObjective_Titan', x: 0.5, y: 0.15 },
    { team_id: 0, team_objective_id: 1, label: 'k_eCitadelTeamObjective_Tier1_Lane1', x: 0.1, y: 0.4 },
    { team_id: 0, team_objective_id: 5, label: 'k_eCitadelTeamObjective_Tier2_Lane1', x: 0.2125, y: 0.2625 },
    { team_id: 0, team_objective_id: 12, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane1', x: 0.4, y: 0.2 },
    { team_id: 0, team_objective_id: 3, label: 'k_eCitadelTeamObjective_Tier1_Lane2', x: 0.505, y: 0.4125 },
    { team_id: 0, team_objective_id: 7, label: 'k_eCitadelTeamObjective_Tier2_Lane2', x: 0.435, y: 0.35 },
    { team_id: 0, team_objective_id: 14, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane2', x: 0.5, y: 0.225 },
    { team_id: 0, team_objective_id: 10, label: 'k_eCitadelTeamObjective_Tier1_Lane3', x: 0.835, y: 0.4 },
    { team_id: 0, team_objective_id: 11, label: 'k_eCitadelTeamObjective_Tier2_Lane3', x: 0.76, y: 0.275 },
    { team_id: 0, team_objective_id: 4, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane3', x: 0.6, y: 0.2 },
    { team_id: 0, team_objective_id: 8, label: 'k_eCitadelTeamObjective_TitanShieldGenerator_1', x: 0.4375, y: 0.15 },
    { team_id: 0, team_objective_id: 15, label: 'k_eCitadelTeamObjective_TitanShieldGenerator_2', x: 0.5625, y: 0.15 },

    // Team 1 Objectives
    { team_id: 1, team_objective_id: 0, label: 'k_eCitadelTeamObjective_Core', x: 0.5, y: 0.87 },
    { team_id: 1, team_objective_id: 9, label: 'k_eCitadelTeamObjective_Titan', x: 0.5, y: 0.85 },
    { team_id: 1, team_objective_id: 1, label: 'k_eCitadelTeamObjective_Tier1_Lane1', x: 0.165, y: 0.6 },
    { team_id: 1, team_objective_id: 5, label: 'k_eCitadelTeamObjective_Tier2_Lane1', x: 0.24, y: 0.7375 },
    { team_id: 1, team_objective_id: 12, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane1', x: 0.4, y: 0.8 },
    { team_id: 1, team_objective_id: 3, label: 'k_eCitadelTeamObjective_Tier1_Lane2', x: 0.505, y: 0.5875 },
    { team_id: 1, team_objective_id: 7, label: 'k_eCitadelTeamObjective_Tier2_Lane2', x: 0.565, y: 0.65 },
    { team_id: 1, team_objective_id: 14, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane2', x: 0.5, y: 0.775 },
    { team_id: 1, team_objective_id: 4, label: 'k_eCitadelTeamObjective_Tier1_Lane3', x: 0.9, y: 0.6 },
    { team_id: 1, team_objective_id: 8, label: 'k_eCitadelTeamObjective_Tier2_Lane3', x: 0.7875, y: 0.725 },
    { team_id: 1, team_objective_id: 15, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane3', x: 0.6, y: 0.8 },
    { team_id: 1, team_objective_id: 10, label: 'k_eCitadelTeamObjective_TitanShieldGenerator_1', x: 0.4375, y: 0.85 },
    { team_id: 1, team_objective_id: 11, label: 'k_eCitadelTeamObjective_TitanShieldGenerator_2', x: 0.5625, y: 0.85 },
  ];

  const destroyedObjectives = [...matchData.match_info.objectives].filter(obj => obj.destroyed_time_s !== 0).sort((a, b) => a.destroyed_time_s - b.destroyed_time_s);
  const currentTime = destroyedObjectives[currentObjectiveIndex]?.destroyed_time_s || 10;
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
    fetch('/match_metadata.json')
      .then(res => res.json())
      .then(data => {
        console.log('Loaded match data:');
        setMatchData(data);
      })
      .catch(err => console.error('Error fetching match data:', err));
  }, []);

  const X_OFFSET = [
    -108 / MINIMAP_SIZE,
    -128 / MINIMAP_SIZE
  ];
  const Y_OFFSETS = [
    7 / MINIMAP_SIZE,
    110 / MINIMAP_SIZE
  ];
  const xScale = [1.05, 1.1];
  const yScale = [0.77, 0.85];

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '300px', padding: '1rem', backgroundColor: '#f0f0f0', marginRight: '20px' }}>
        <h3>Current Time: {currentTime} seconds</h3>
        <h3>Objective Info</h3>
        {/* Legend for minimap colors */}
        <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}>
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
        {destroyedObjectives.filter((_, index) => index <= currentObjectiveIndex).map((obj, idx) => (
          <div key={idx} style={{ marginBottom: '1rem', borderBottom: '1px solid #ccc' }}>
            <strong>ID:</strong> {obj.team_objective_id}<br />
            <strong>Team ID:</strong> {obj.team}<br />
            <strong>Destroyed Time (s):</strong> {obj.destroyed_time_s}<br />
            <strong>Creep Damage:</strong> {obj.creep_damage}<br />
            <strong>Creep Damage Mitigated:</strong> {obj.creep_damage_mitigated}<br />
            <strong>Player Damage:</strong> {obj.player_damage}<br />
            <strong>Player Damage Mitigated:</strong> {obj.player_damage_mitigated}<br />
            <strong>First Damage Time (s):</strong> {obj.first_damage_time_s}<br />
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', width: `${MINIMAP_SIZE}px`, height: `${MINIMAP_SIZE}px` }}>
        <img ref={mapRef} src={MINIMAP_URL} alt="Minimap" style={{ width: '100%' }} />
        <button onClick={handlePrevious} style={{ margin: '0.5rem' }}>Previous</button>
        <button onClick={handleNext} style={{ margin: '0.5rem' }}>Next</button>

        {objectiveCoordinates.map(({ team_id, team_objective_id, label, x, y }) => {
          const { left, top } = renderObjectiveDot({ label, x, y, team_id, team_objective_id });
          const match = destroyedObjectives.find(obj => Number(obj.team) === team_id && Number(obj.team_objective_id) === team_objective_id);
          const isDestroyed = match ? currentTime >= match.destroyed_time_s : false;
          const isActive = activeObjectiveKey === `${team_id}_${team_objective_id}`;
          const color = isDestroyed ? 'black' : 'red';

          return <div
            key={`${team_id}_${team_objective_id}`}
            title={`${team_id}_${team_objective_id}`}
            style={{
              position: 'absolute',
              left,
              top,
              width: 10,
              height: 10,
              backgroundColor: color,
              borderRadius: '50%',
              border: isActive ? '2px solid yellow' : '1px solid red',
              transform: 'translate(-50%, -50%)',
            }}
          />;
        })}

        {playerPaths.map(player => {
          const playerInfo = matchData.match_info.players?.find((p: PlayerInfo) => p.player_slot === player.player_slot);
          const team = playerInfo ? playerInfo.team : 0;
          // if (team !== 0) return null;
          const color = team === 0 ? 'rgba(0,128,255,0.3)' : 'rgba(0,200,0,0.3)';
          return player.x_pos.map((x, idx) => {
            const y = player.y_pos[idx];
            if (x !== undefined && y !== undefined) {
              // Apply normalization and offset
              const normX = (x / xResolution) * xScale[team] + X_OFFSET[team];
              const normY = (y / yResolution) * yScale[team] + Y_OFFSETS[team];
              const { left, top } = renderPlayerDot(normX, normY);
              return (
                <div
                  key={`player-${player.player_slot}-pt-${idx}`}
                  title={`Player ${player.player_slot} t=${idx}`}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width: 6,
                    height: 6,
                    backgroundColor: color,
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                />
              );
            }
            return null;
          });
        })}

        {playerPaths.map(player => {
          const playerInfo = matchData.match_info.players?.find((p: PlayerInfo) => p.player_slot === player.player_slot);
          const team = playerInfo ? playerInfo.team : 0;
          if (team !== 0) return null;
          const color = 'rgba(0,64,255,0.8)';
          const playerX = player.x_pos[currentTime];
          const playerY = player.y_pos[currentTime];
          if (playerX !== undefined && playerY !== undefined) {
            const normX = (playerX / xResolution) * xScale[team] + X_OFFSET[team];
            const normY = (playerY / yResolution) * yScale[team] + Y_OFFSETS[team];
            const { left, top } = renderPlayerDot(normX, normY);
            return (
              <div
                key={`player-${player.player_slot}-current`}
                title={`Player ${player.player_slot} at currentTime`}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width: 10,
                  height: 10,
                  backgroundColor: color,
                  borderRadius: '50%',
                  border: '2px solid #222',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default Minimap;
