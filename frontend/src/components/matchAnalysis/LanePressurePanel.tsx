import { LanePressureData } from '../../domain/lanePressure';
import { PlayerData } from '../../domain/player';

interface LanePressurePanelProps {
  lanePressure: LanePressureData;
  currentTick: number;
  players: PlayerData[];
}

const LanePressurePanel = ({
  lanePressure,
  currentTick,
  players,
}: LanePressurePanelProps) => {
  // Build a map of custom_id -> player name for quick lookup
  const playerNameMap = new Map<number, string>();
  players.forEach((player) => {
    playerNameMap.set(parseInt(player.custom_id), player.name);
  });

  // Debug: Check if we have pressure data
  if (
    !lanePressure ||
    !lanePressure.pressure ||
    Object.keys(lanePressure.pressure).length === 0
  ) {
    console.log('[LanePressurePanel] No pressure data available', {
      lanePressure,
      currentTick,
    });
    return (
      <div className='mb-2 rounded bg-gray-100 p-3 text-sm text-gray-500'>
        No active creep waves
      </div>
    );
  }

  // Collect all active pressure snapshots for current tick
  const activePressures: Array<{
    laneTeamKey: string;
    lane: string;
    team: number;
    teamName: string;
    pressure: number;
    playerNames: string[];
  }> = [];

  for (const [laneTeamKey, pressureSnapshots] of Object.entries(
    lanePressure.pressure
  )) {
    if (!pressureSnapshots || pressureSnapshots.length === 0) {
      console.log(`[LanePressurePanel] No snapshots for ${laneTeamKey}`);
      continue;
    }

    const snapshot =
      currentTick < pressureSnapshots.length ?
        pressureSnapshots[currentTick]
      : null;

    if (!snapshot) {
      continue; // No pressure data for this tick
    }

    // Parse lane and team from key (format: "lane_team")
    const [lane, teamStr] = laneTeamKey.split('_');
    const team = parseInt(teamStr);
    const teamName = team === 2 ? 'Amber' : 'Sapphire';

    // Get player names from attributed player IDs
    const playerNames = snapshot.attributed_players
      .map((customId) => playerNameMap.get(customId) || `Player ${customId}`)
      .sort();

    activePressures.push({
      laneTeamKey,
      lane,
      team,
      teamName,
      pressure: snapshot.pressure,
      playerNames,
    });
  }

  // Sort by lane first, then by team (Amber before Sapphire)
  activePressures.sort((a, b) => {
    const laneCompare = a.lane.localeCompare(b.lane);
    if (laneCompare !== 0) return laneCompare;
    return a.team - b.team;
  });

  if (activePressures.length === 0) {
    return (
      <div className='mb-2 rounded bg-gray-100 p-3 text-sm text-gray-500'>
        No active creep waves
      </div>
    );
  }

  return (
    <div className='mb-2 rounded bg-gray-800 p-3 text-sm text-white'>
      <div className='mb-1 font-semibold text-gray-300'>Lane Pressure</div>
      <div className='space-y-1'>
        {activePressures.map((item) => {
          const teamColor = item.team === 2 ? '#FFA500' : '#0EA5E9';
          const pressurePercent = (item.pressure * 100).toFixed(0);

          return (
            <div
              key={item.laneTeamKey}
              className='flex items-center gap-2'
            >
              <div
                className='flex h-4 w-4 shrink-0 items-center justify-center'
                style={{ color: teamColor }}
              >
                ▲
              </div>
              <div className='flex-1'>
                <span className='font-medium'>
                  Lane {item.lane} {item.teamName}:
                </span>{' '}
                <span className='text-gray-300'>{pressurePercent}%</span>
                {item.playerNames.length > 0 && (
                  <span className='text-gray-400'>
                    {' '}
                    ({item.playerNames.join(', ')})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LanePressurePanel;
