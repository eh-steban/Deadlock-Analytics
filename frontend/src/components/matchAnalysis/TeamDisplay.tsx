import React from 'react';
import { ParsedPlayer } from '../../types/Player';

interface TeamDisplayProps {
  players: ParsedPlayer[];
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({ players }) => {
  // Team colors (circle backgrounds)
  const teamColors = {
    2: '#FF8C00', // Amber (Dark Orange)
    3: '#4169E1', // Sapphire (Royal Blue)
  };

  // Lane colors (rectangle backgrounds)
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
      // Sort by lane: 1, 2, 4 (0 last for fallback)
      const laneOrder = [1, 2, 4, 0];
      return laneOrder.indexOf(a.lane) - laneOrder.indexOf(b.lane);
    });

  const sapphirePlayers = players
    .filter(p => p.team === 3)
    .sort((a, b) => {
      const laneOrder = [1, 2, 4, 0];
      return laneOrder.indexOf(a.lane) - laneOrder.indexOf(b.lane);
    });

  const renderPlayer = (player: ParsedPlayer) => {
    const teamColor = teamColors[player.team as 2 | 3] || '#808080';
    const laneColor = laneColors[player.lane] || laneColors[0];

    return (
      <div
        key={player.custom_id}
        className={`${laneColor} flex items-center justify-center`}
        style={{
          width: '78px',   // 64px circle + ~14px padding
          height: '94px',  // 64px circle + ~30px padding
        }}
      >
        <div
          className="rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: teamColor,
          }}
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
