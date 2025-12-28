import React from 'react';
import { ParsedPlayer } from '../../types/Player';

interface TeamDisplayProps {
  players: ParsedPlayer[];
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({ players }) => {
  const teamColors = {
    2: '#FF8C00', // Amber (Dark Orange)
    3: '#4169E1', // Sapphire (Royal Blue)
  };

  const laneColors: Record<number, string> = {
    1: 'bg-yellow-500',
    4: 'bg-blue-500',
    6: 'bg-green-500',
    0: 'bg-gray-500', // Fallback for missing lane data
  };

  // Split and sort players by team
  const amberPlayers = players
    .filter(p => p.team === 2)
    .sort((a, b) => {
      // Sort by lane: 1, 4, 6 (0 last for fallback)
      const laneOrder = [1, 4, 6, 0];
      return laneOrder.indexOf(a.lane) - laneOrder.indexOf(b.lane);
    });

  const sapphirePlayers = players
    .filter(p => p.team === 3)
    .sort((a, b) => {
      const laneOrder = [1, 4, 6, 0];
      return laneOrder.indexOf(a.lane) - laneOrder.indexOf(b.lane);
    });

  const renderPlayer = (player: ParsedPlayer) => {
    const teamColor = teamColors[player.team as 2 | 3] || '#808080';
    const laneColor = laneColors[player.lane] || laneColors[0];

    return (
      <div
        key={player.custom_id}
        className={`${laneColor} w-20 h-28 mr-1 rounded-md flex items-start justify-center pt-2`}
      >
        <div
          className="rounded-full overflow-hidden flex size-17 justify-center"
          style={{ backgroundColor: teamColor }}
        >
          <img
            src={player.hero.heroCardWebp || player.hero.minimapImage}
            alt={player.hero.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex justify-between w-full px-8 py-4">
      {/* Amber Team - Left */}
      <div className="flex">
        {amberPlayers.map(renderPlayer)}
      </div>

      {/* Sapphire Team - Right */}
      <div className="flex">
        {sapphirePlayers.map(renderPlayer)}
      </div>
    </div>
  );
};

export default TeamDisplay;
