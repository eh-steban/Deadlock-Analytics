import React from "react";
import { ScaledPlayerCoord } from "./Minimap";

interface PlayerPositionsProps {
  scaledPlayerCoords: ScaledPlayerCoord[];
}

const PlayerPositions: React.FC<PlayerPositionsProps> = ({
  scaledPlayerCoords,
}) => {
  return (
    <>
      {scaledPlayerCoords.map((coord, index) => {
        const hero = coord.hero;
        const heroName = hero?.name || "Unknown";
        const minimapImg = hero?.images?.minimap_image_webp;

        return (
          <img
            key={`${heroName} Player-${coord.playerId}-${index}`}
            title={`${heroName} Player ${coord.playerId} left: ${coord.left} top: ${coord.top}`}
            src={minimapImg}
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
