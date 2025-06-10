import React, { useRef, useState, useEffect } from 'react';

const MINIMAP_SIZE = 768;
const MINIMAP_URL = 'https://assets-bucket.deadlock-api.com/assets-api-res/images/maps/minimap.png';
const heros: { [key: number]: string } = {'1': 'Infernus', '2': 'Seven', '3': 'Vindicta', '4': 'Lady Geist', '6': 'Abrams', '7': 'Wraith', '8': 'McGinnis', '10': 'Paradox', '11': 'Dynamo', '12': 'Kelvin', '13': 'Haze', '14': 'Holliday', '15': 'Bebop', '16': 'Calico', '17': 'Grey Talon', '18': 'Mo & Krill', '19': 'Shiv', '20': 'Ivy', '25': 'Warden', '27': 'Yamato', '31': 'Lash', '35': 'Viscous', '48': 'Wrecker', '50': 'Pocket', '52': 'Mirage', '53': 'Fathom', '58': 'Vyper', '60': 'Sinclair', '61': 'Trapper', '62': 'Raven'};
const HEROS_URL = 'https://assets.deadlock-api.com/v2/heroes?only_active=true';

interface PlayerInfo {
  account_id: number;
  player_slot: number;
  team: number;
  hero_id: number;
}

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
  move_type: Array<number>;
  combat_type: Array<number>;
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

  const objectiveCoordinates: ObjectiveCoordinate[] = [
    { label: 'Midboss', x: 0.6, y: 0.5 },

    // Team 0 Objectives
    // NOTE: The labels are a combination of a couple of message types listed in the protos here:
    // https://github.com/SteamDatabase/Protobufs/blob/ad608d0b059c4f58a12abb621cb729bed999fa02/deadlock/citadel_gcmessages_common.proto
    { team_id: 0, team_objective_id: 0, label: 'k_eCitadelTeamObjective_Core', x: 0.6, y: 0.13 },
    { team_id: 0, team_objective_id: 9, label: 'k_eCitadelTeamObjective_Titan', x: 0.6, y: 0.15 },
    { team_id: 0, team_objective_id: 1, label: 'k_eCitadelTeamObjective_Tier1_Lane1', x: 0.2, y: 0.4 },
    { team_id: 0, team_objective_id: 5, label: 'k_eCitadelTeamObjective_Tier2_Lane1', x: 0.3125, y: 0.2625 },
    { team_id: 0, team_objective_id: 12, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane1', x: 0.5, y: 0.2 },
    { team_id: 0, team_objective_id: 3, label: 'k_eCitadelTeamObjective_Tier1_Lane2', x: 0.605, y: 0.4125 },
    { team_id: 0, team_objective_id: 7, label: 'k_eCitadelTeamObjective_Tier2_Lane2', x: 0.535, y: 0.35 },
    { team_id: 0, team_objective_id: 14, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane2', x: 0.6, y: 0.225 },
    { team_id: 0, team_objective_id: 10, label: 'k_eCitadelTeamObjective_Tier1_Lane3', x: 0.935, y: 0.4 },
    { team_id: 0, team_objective_id: 11, label: 'k_eCitadelTeamObjective_Tier2_Lane3', x: 0.86, y: 0.275 },
    { team_id: 0, team_objective_id: 4, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane3', x: 0.7, y: 0.2 },
    { team_id: 0, team_objective_id: 8, label: 'k_eCitadelTeamObjective_TitanShieldGenerator_1', x: 0.5375, y: 0.15 },
    { team_id: 0, team_objective_id: 15, label: 'k_eCitadelTeamObjective_TitanShieldGenerator_2', x: 0.6625, y: 0.15 },

    // Team 1 Objectives
    { team_id: 1, team_objective_id: 0, label: 'k_eCitadelTeamObjective_Core', x: 0.6, y: 0.87 },
    { team_id: 1, team_objective_id: 9, label: 'k_eCitadelTeamObjective_Titan', x: 0.6, y: 0.85 },
    { team_id: 1, team_objective_id: 1, label: 'k_eCitadelTeamObjective_Tier1_Lane1', x: 0.265, y: 0.6 },
    { team_id: 1, team_objective_id: 5, label: 'k_eCitadelTeamObjective_Tier2_Lane1', x: 0.34, y: 0.7375 },
    { team_id: 1, team_objective_id: 12, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane1', x: 0.5, y: 0.8 },
    { team_id: 1, team_objective_id: 3, label: 'k_eCitadelTeamObjective_Tier1_Lane2', x: 0.605, y: 0.5875 },
    { team_id: 1, team_objective_id: 7, label: 'k_eCitadelTeamObjective_Tier2_Lane2', x: 0.665, y: 0.65 },
    { team_id: 1, team_objective_id: 14, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane2', x: 0.6, y: 0.775 },
    { team_id: 1, team_objective_id: 4, label: 'k_eCitadelTeamObjective_Tier1_Lane3', x: 1, y: 0.6 },
    { team_id: 1, team_objective_id: 8, label: 'k_eCitadelTeamObjective_Tier2_Lane3', x: 0.8875, y: 0.725 },
    { team_id: 1, team_objective_id: 15, label: 'k_eCitadelTeamObjective_BarrackBoss_Lane3', x: 0.7, y: 0.8 },
    { team_id: 1, team_objective_id: 10, label: 'k_eCitadelTeamObjective_TitanShieldGenerator_1', x: 0.5375, y: 0.85 },
    { team_id: 1, team_objective_id: 11, label: 'k_eCitadelTeamObjective_TitanShieldGenerator_2', x: 0.6625, y: 0.85 },
  ];

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
          <button onClick={() => setPlayerTime(t => Math.max(0, t - 60))}>Player Time -</button>
          <button onClick={() => setPlayerTime(t => t + 60)}>Player Time +</button>
          <span>Player Time: {playerTime}s</span>

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

          {/* Map all player positions on both teams for a match */}
          {playerPaths.map(player => {
            const playerInfo = matchData.match_info.players?.find((p: PlayerInfo) => p.player_slot === player.player_slot);
            const team = playerInfo ? playerInfo.team : 0;

            // ****** NOTE: This is the current attempt at only showing a specific hero ******
            // if (playerInfo?.hero_id !== 1) return null;
            // if (heroData[(playerInfo?.hero_id || 1 - 1)]?.name !== "Infernus") return null;
            // if (heros[`${playerInfo?.hero_id || 1}`] !== "Seven") return null;
            // console.log('Rendering Hero:', (playerInfo?.hero_id || 1), 'Hero:', heros[`${playerInfo?.hero_id || 1}`]);
            // *******************************************************************************

            // NOTE: If I want to only render team0 or team1, I can use the following check
            // if (team !== 0) return null;
            // NOTE: If I want to only render a certain player, I can use the following check
            // if (player.player_slot !== 1) return null;
            const color = team === 0 ? 'rgba(0,128,255,0.3)' : 'rgba(0,200,0,0.3)';
            const zipcolor = 'rgba(229, 255, 0, 0.45)';
            return player.x_pos.map((x, idx) => {
              const y = player.y_pos[idx];
              const moveType = player.move_type[idx];
              if (x !== undefined && y !== undefined) {
                const normPlayerX = player.x_min + (x / xResolution) * (player.x_max - player.x_min)
                const normPlayerY = player.y_min + (y / yResolution) * (player.y_max - player.y_min)

                const allPlayerXMin = Math.min(...playerPaths.map(p => p.x_min));
                const allPlayerXMax = Math.max(...playerPaths.map(p => p.x_max));
                const allPlayerYMin = Math.min(...playerPaths.map(p => p.y_min));
                const allPlayerYMax = Math.max(...playerPaths.map(p => p.y_max));

                const scaledPlayerX = ((normPlayerX - allPlayerXMin) / (allPlayerXMax - allPlayerXMin));
                const scaledPlayerY = ((normPlayerY - allPlayerYMin) / (allPlayerYMax - allPlayerYMin));

                const { left, top } = renderPlayerDot(scaledPlayerX, scaledPlayerY);

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
                      backgroundColor: moveType !== 6 ? color : zipcolor,
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

          {/* Map all player positions on both teams at the time of an objective being destroyed */}
          {playerPaths.map(player => {
            const playerInfo = matchData.match_info.players?.find((p: PlayerInfo) => p.player_slot === player.player_slot);
            const team = playerInfo ? playerInfo.team : 0;
            // if (team !== 0) return null;
            const color = team === 0 ? 'rgb(4, 0, 255)' : 'rgb(3, 100, 3)';
            const playerX = player.x_pos[currentTime];
            const playerY = player.y_pos[currentTime];
            if (playerX !== undefined && playerY !== undefined) {
              const normPlayerX = player.x_min + (playerX / xResolution) * (player.x_max - player.x_min);
              const normPlayerY = player.y_min + (playerY / yResolution) * (player.y_max - player.y_min);

              const allPlayerXMin = Math.min(...playerPaths.map(p => p.x_min));
              const allPlayerXMax = Math.max(...playerPaths.map(p => p.x_max));
              const allPlayerYMin = Math.min(...playerPaths.map(p => p.y_min));
              const allPlayerYMax = Math.max(...playerPaths.map(p => p.y_max));

              const scaledPlayerX = ((normPlayerX - allPlayerXMin) / (allPlayerXMax - allPlayerXMin));
              const scaledPlayerY = ((normPlayerY - allPlayerYMin) / (allPlayerYMax - allPlayerYMin));

              const { left, top } = renderPlayerDot(scaledPlayerX, scaledPlayerY);

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
                    border: '2px solid #ff0000',
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

      {/* Player combat type/health Table */}
      <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '2rem', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
        <h4>Player Data (60s Window)</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: '0.95em' }}>
          <thead>
            <tr style={{ background: '#f7f7f7' }}>
              <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Hero</th>
              <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Player Slot</th>
              <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Team</th>
              <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Time Window</th>
              <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Combat Types</th>
              <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Combat Type Counts</th>
              <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Health Range</th>
            </tr>
          </thead>
          <tbody>
            {playerPaths.map(player => {
              const playerInfo = matchData.match_info.players?.find((p: PlayerInfo) => p.player_slot === player.player_slot);
              if (!playerInfo) return null;
              const team = playerInfo.team;
              const heroName = heros[playerInfo.hero_id] || `Hero ${playerInfo.hero_id}`;
              const windowStart = playerTime;
              const windowEnd = playerTime + 60;
              const moveTypes = player.move_type.slice(windowStart, windowEnd) || [];
              const healths = player.health.slice(windowStart, windowEnd) || [];
              const combatTypes = player.combat_type.slice(windowStart, windowEnd) || [];
              if (moveTypes.length === 0 && healths.length === 0 && combatTypes.length === 0) return null;
              const combatTypeSet = Array.from(new Set(combatTypes.filter(x => x !== undefined)));
              const combatTypeLabels = ["Out of Combat", "Player", "Enemy NPC", "Neutral"];
              const combatTypeLabelList = combatTypeSet.map(type => combatTypeLabels[type] || type).join(', ');
              const minHealth = Math.min(...healths.filter(x => x !== undefined));
              const maxHealth = Math.max(...healths.filter(x => x !== undefined));
              const combatTypeCounts: { [key: number]: number } = {};
              combatTypes.forEach(type => {
                if (type !== undefined) combatTypeCounts[type] = (combatTypeCounts[type] || 0) + 1;
              });
              return (
                <tr key={`player-agg-row-${player.player_slot}`}
                  style={{ background: '#e6f7ff', fontWeight: 'bold' }}>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{heroName}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{player.player_slot}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{team}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>[{windowStart} - {windowEnd - 1}]</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{combatTypeLabelList}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{combatTypeSet.map(type => `${combatTypeLabels[type] || type}: ${combatTypeCounts[type] || 0}`).join(', ')}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{minHealth} - {maxHealth}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Damage Source Types Table */}
      <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '2rem', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
        <h4>Damage Source Types</h4>
        {matchData.match_info && matchData.match_info.damage_matrix && matchData.match_info.damage_matrix.source_details && matchData.match_info.damage_matrix.source_details.stat_type && matchData.match_info.damage_matrix.source_details.source_name ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: '0.95em' }}>
            <thead>
              <tr style={{ background: '#f7f7f7' }}>
                <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Index</th>
                <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Stat Type (Label)</th>
                <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Stat Type (Number)</th>
                <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Source Name</th>
              </tr>
            </thead>
            <tbody>
              {matchData.match_info.damage_matrix.source_details.stat_type.map((statTypeNum: number, idx: number) => (
                <tr key={`source-detail-row-${idx}`} style={{ background: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{idx}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{StatType[statTypeNum] !== undefined ? StatType[statTypeNum] : statTypeNum}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{statTypeNum}</td>
                  <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{matchData.match_info.damage_matrix.source_details.source_name[idx]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No damage source details available.</div>
        )}
      </div>

      {/* Damage Matrix Table */}
      <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '2rem', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
        <h4>Damage Matrix Data (per sample_time_s)</h4>
        {matchData.match_info && (matchData as any).match_info.damage_matrix && (matchData as any).match_info.damage_matrix.sample_time_s && (matchData as any).match_info.damage_matrix.damage_dealers ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: '0.95em' }}>
            <thead>
              <tr style={{ background: '#f7f7f7' }}>
                <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Sample Time (s)</th>
                <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Dealer Player Slot</th>
                <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Damage To Players</th>
              </tr>
            </thead>
            <tbody>
              {(matchData as any).match_info.damage_matrix.sample_time_s.map((sampleTime: number, sampleIdx: number) => {
                return (matchData as any).match_info.damage_matrix.damage_dealers.map((dealer: any, dealerIdx: number) => {
                  const sources = dealer.damage_sources || [];
                  let sampleSources = Array.isArray(sources[0]) ? sources[sampleIdx] : sources;
                  if (!sampleSources || sampleSources.length === 0) return null;
                  if (!Array.isArray(sampleSources)) return null;

                  // For each source, collect damage_to_players info for this sampleIdx. Use source_details_index
                  // to display damage source id/name, target, and damage amount. Each sample spans 180 seconds.
                  const damageToPlayersSummary = sampleSources.map((src: any) => {
                    if (!src.damage_to_players || !Array.isArray(src.damage_to_players) || src.damage_to_players.length === 0) return null;
                    const perTarget = src.damage_to_players
                      .map((dtp: any) => {
                        const dmg = Array.isArray(dtp.damage) ? dtp.damage[sampleIdx] : undefined;
                        if (dmg === undefined || dmg === 0) return null;
                        const target = dtp.target_player_slot !== undefined ? dtp.target_player_slot : '-';
                        // NOTE: Looks like source_details: { stat_type: number[]; source_name: string[]; };
                        const { stat_type: sourceStatType, source_name: sourceName } = matchData.match_info.damage_matrix.source_details;
                        return `Source  Index (${src.source_details_index}),
                                Name: ${sourceName[src.source_details_index]},
                                Stat Type Number ${sourceStatType[src.source_details_index]},
                                and Stat Type Name ${StatType[sourceStatType[src.source_details_index]]}|
                                Target: ${target} |
                                Damage: ${dmg}`;
                      })
                      .filter(Boolean)
                      .join('; ');
                    return `${perTarget}`;
                  }).filter(Boolean).join(' | ');

                  return (
                    <tr key={`damage-matrix-row-${sampleIdx}-${dealerIdx}`} style={{ background: sampleIdx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                      <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{sampleTime}</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{dealer.dealer_player_slot !== undefined ? dealer.dealer_player_slot : '-'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{damageToPlayersSummary || '-'}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        ) : (
          <div>No damage matrix data available.</div>
        )}
      </div>
    </>
  );
};

export default Minimap;
