import React from "react";
import { ScaledPlayerCoord, PlayerData } from "../../domain/player";

interface PlayerPositionsProps {
  scaledPlayerCoords: ScaledPlayerCoord[];
  players: PlayerData[];
}

const PlayerPositions: React.FC<PlayerPositionsProps> = ({
  scaledPlayerCoords,
  players,
}) => {
  return (
    <>
      {scaledPlayerCoords.map((coord, index) => {
        const player = players.find(
          (p) => p.lobby_player_slot === Number(coord.customId)
        );
        const heroName = player?.hero.name || "Unknown";
        const minimapImage = player?.hero.minimapImage;

        return (
          <img
            key={`${heroName} Player-${coord.customId}-${index}`}
            title={`${heroName} Player ${coord.customId} left: ${coord.left} top: ${coord.top}`}
            src={minimapImage}
            alt={`${heroName}`}
            className='pointer-events-auto absolute z-[99] h-[20px] w-[20px] rounded-full border-2 border-white object-contain'
            style={{ left: coord.left, top: coord.top }}
          />
        );
      })}
    </>
  );
};

export default PlayerPositions;
