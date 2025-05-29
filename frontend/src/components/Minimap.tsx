import React, { useRef, useState, useEffect } from 'react';

const RADIUS = 10752;
const DIAMETER = RADIUS * 2;
const MINIMAP_SIZE = 512;
// TODO: Figure out if we need this constant
const API_URL = 'https://assets.deadlock-api.com/v1/map';

interface Objective {
  team: string;
  team_objective_id: string;
  destroyed_time_s?: number;
  creep_damage?: number;
  creep_damage_mitigated?: number;
  player_damage?: number;
  player_damage_mitigated?: number;
  first_damage_time_s?: number;
}

const Minimap = () => {
  const mapRef = useRef<HTMLImageElement>(null);
  const images = { minimap: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/maps/minimap.png' };
  const [error, setError] = useState(false);
  const [matchData, setMatchData] = useState<{ match_info: { objectives: Objective[] } }>({ match_info: { objectives: [] } });
  const objectives = matchData.match_info.objectives;

  const objectiveCoordinates = [
    { label: 'Midboss', x: 0 * RADIUS, y: 0 * RADIUS },

    // Team0
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_Core', x: 0 * RADIUS, y: -0.75 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_Titan', x: 0 * RADIUS, y: -0.7 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_Tier1_Lane1', x: -0.8 * RADIUS, y: -0.2 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_Tier2_Lane1', x: -0.575 * RADIUS, y: -0.475 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_BarrackBoss_Lane1', x: -0.2 * RADIUS, y: -0.6 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_Tier1_Lane2', x: 0.01 * RADIUS, y: -0.175 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_Tier2_Lane2', x: -0.13 * RADIUS, y: -0.3 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_BarrackBoss_Lane2', x: 0 * RADIUS, y: -0.55 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_Tier1_Lane3', x: 0.67 * RADIUS, y: -0.2 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_Tier2_Lane3', x: 0.52 * RADIUS, y: -0.45 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_BarrackBoss_Lane3', x: 0.2 * RADIUS, y: -0.6 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_TitanShieldGenerator_1', x: -0.125 * RADIUS, y: -0.7 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team0_k_eCitadelTeamObjective_TitanShieldGenerator_2', x: 0.125 * RADIUS, y: -0.7 * RADIUS },

    // Team1
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_Core', x: 0 * RADIUS, y: 0.75 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_Titan', x: 0 * RADIUS, y: 0.7 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_Tier1_Lane1', x: -0.67 * RADIUS, y: 0.2 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_Tier2_Lane1', x: -0.52 * RADIUS, y: 0.475 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_BarrackBoss_Lane1', x: -0.2 * RADIUS, y: 0.6 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_Tier1_Lane2', x: 0.01 * RADIUS, y: 0.175 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_Tier2_Lane2', x: 0.13 * RADIUS, y: 0.3 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_BarrackBoss_Lane2', x: 0 * RADIUS, y: 0.55 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_Tier1_Lane3', x: 0.8 * RADIUS, y: 0.2 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_Tier2_Lane3', x: 0.575 * RADIUS, y: 0.45 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_BarrackBoss_Lane3', x: 0.2 * RADIUS, y: 0.6 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_TitanShieldGenerator_1', x: -0.125 * RADIUS, y: 0.7 * RADIUS },
    { label: 'k_ECitadelLobbyTeam_Team1_k_eCitadelTeamObjective_TitanShieldGenerator_2', x: 0.125 * RADIUS, y: 0.7 * RADIUS },
  ];

  // Check objectives array for destroyed objectives
  const objectivesDestroyed = new Set(
    objectives
      .filter(obj => obj.destroyed_time_s)
      .map(obj => `${obj.team}_${obj.team_objective_id}`)
  );

  useEffect(() => {
    fetch('/match_metadata.json')
      .then(res => res.json())
      .then(data => {
        console.log('Loaded match data:', data);
        setMatchData(data);
      })
      .catch(err => console.error('Error fetching match data:', err));
  }, []);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div style={{ float: 'left', width: '300px', padding: '1rem', backgroundColor: '#f0f0f0' }}>
        <h3>Objective Info</h3>
        {objectives.map((obj, idx) => (
          <div key={idx} style={{ marginBottom: '1rem', borderBottom: '1px solid #ccc' }}>
            <strong>ID:</strong> {obj.team_objective_id}<br/>
            <strong>Team:</strong> {obj.team}<br/>
            <strong>Destroyed Time (s):</strong> {obj.destroyed_time_s}<br/>
            <strong>Creep Damage:</strong> {obj.creep_damage}<br/>
            <strong>Creep Damage Mitigated:</strong> {obj.creep_damage_mitigated}<br/>
            <strong>Player Damage:</strong> {obj.player_damage}<br/>
            <strong>Player Damage Mitigated:</strong> {obj.player_damage_mitigated}<br/>
            <strong>First Damage Time (s):</strong> {obj.first_damage_time_s}<br/>
          </div>
        ))}
      </div>
      {error ? (
        <div style={{ color: 'red', textAlign: 'center', padding: '1rem' }}>
          Failed to load minimap data.
        </div>
      ) : (
        <div style={{ position: 'relative', float: 'right', width: `${MINIMAP_SIZE}px`, height: `${MINIMAP_SIZE}px` }}>
          <img
            ref={mapRef}
            src={images.minimap}
            alt="Minimap"
            style={{ width: '100%', height: 'auto' }}
            onError={() => {
              console.error('Image failed to load');
              setError(true);
            }}
          />

          {images.minimap && objectiveCoordinates.map(({ label, x, y }) => {
            const left = ((x / DIAMETER) + 0.5) * MINIMAP_SIZE;
            const top = ((-y / DIAMETER) + 0.5) * MINIMAP_SIZE;
            const isDestroyed = objectivesDestroyed.has(label);
            const color = isDestroyed ? 'black' : 'red';

            return (
              <div
                key={label}
                aria-label={label}
                style={{
                  position: 'absolute',
                  left: `${left}px`,
                  top: `${top}px`,
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: color,
                    borderRadius: '50%',
                    margin: '0 auto'
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Minimap;
