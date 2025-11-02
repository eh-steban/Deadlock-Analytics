import React from "react";
import {
  Hero,
  PlayerData,
  PlayerGameData,
  PlayerPosition,
  PositionWindow,
} from "../../types/Player";
import { Position } from "postcss";

interface PlayerPositionsProps {
  // playerPositions: PositionWindow[];
  perPlayerData: Record<string, PlayerGameData>;
  playersData: PlayerData[];
  currentTick: number;
  heroes: Hero[];
  renderPlayerDot: (x: number, y: number) => { left: number; top: number };
  scalePlayerPosition: (playerPos: PlayerPosition) => {
    scaledPlayerX: number;
    scaledPlayerY: number;
  };
}

const PlayerPositions: React.FC<PlayerPositionsProps> = ({
  // playerPositions,
  perPlayerData,
  playersData,
  currentTick,
  heroes,
  renderPlayerDot,
  scalePlayerPosition,
}) => {
  const playerPositions: PositionWindow[] = Object.entries(perPlayerData).map(
    ([playerIdx, playerGameData]) => playerGameData.positions
  );

  return (
    <>
      {playerPositions.map((playerPosition) => {
        const customId = Number(playerPosition[currentTick].custom_id);
        const playerData = playersData?.find(
          (player: PlayerData) => player.lobby_player_slot === customId
        );
        if (!playerData) return null;

        const hero = heroes.find((h) => h.id === playerData.hero_id);
        const heroName = hero?.name || `Hero ${playerData.hero_id}`;
        const minimapImg = hero?.images?.minimap_image_webp;
        const team = playerData.team;
        // NOTE: If we don't have a minimap image, we use the color based on the team
        const color = team === 2 ? "rgba(0,128,255,0.7)" : "rgba(0,200,0,0.7)";
        const playerPos = playerPosition[currentTick];

        if (playerPos) {
          const { scaledPlayerX, scaledPlayerY } =
            scalePlayerPosition(playerPos);
          const { left, top } = renderPlayerDot(scaledPlayerX, scaledPlayerY);

          return minimapImg ?
              <img
                key={`${heroName} Player-${customId}`}
                title={`${heroName} Player ${customId} left: ${left} top: ${top}`}
                src={minimapImg}
                alt={`${heroName}`}
                className='pointer-events-auto absolute z-[99] h-[20px] w-[20px] rounded-full border-2 border-white object-contain'
                style={{ left, top, background: color }}
              />
            : <div
                key={`${heroName} Player-${customId}`}
                title={`${heroName} Player ${customId} left: ${left} top: ${top}`}
                className='pointer-events-auto absolute z-2 h-[10px] w-[10px] translate-x-1/2 translate-y-1/2 rounded-full border-2 border-red-600'
                style={{ left, top, backgroundColor: color }}
              />;
        }
        return null;
      })}
    </>
  );
};

export default PlayerPositions;
