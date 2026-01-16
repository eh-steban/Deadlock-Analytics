import React from 'react';
import { ParsedPlayer } from '../../domain/player';

interface PlayerSelectorProps {
  players: ParsedPlayer[];
  selectedPlayerId: string | null;
  onPlayerChange: (playerId: string) => void;
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  selectedPlayerId,
  onPlayerChange,
}) => {
  // Group players by team
  const amberPlayers = players.filter((p) => p.team === 2);
  const sapphirePlayers = players.filter((p) => p.team === 3);

  return (
    <div className="flex gap-2 items-center">
      <label className="text-sm font-semibold text-gray-700">Player:</label>
      <select
        value={selectedPlayerId || ''}
        onChange={(e) => onPlayerChange(e.target.value)}
        className="px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">
          Select a player
        </option>

        <optgroup label="Amber Team">
          {amberPlayers.map((player) => (
            <option key={player.custom_id} value={player.custom_id}>
              {player.name} ({player.hero.name})
            </option>
          ))}
        </optgroup>

        <optgroup label="Sapphire Team">
          {sapphirePlayers.map((player) => (
            <option key={player.custom_id} value={player.custom_id}>
              {player.name} ({player.hero.name})
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
};

export default PlayerSelector;
