import React from "react";
import { Hero, PlayerPathState, PlayerInfo } from "../../types/Player";

interface PlayerPositionsProps {
  playerPaths: PlayerPathState[];
  players: PlayerInfo[];
  currentTick: number;
  xResolution: number;
  yResolution: number;
  heroes: Hero[];
  renderPlayerDot: (x: number, y: number) => { left: number; top: number };
}

const PlayerPositions: React.FC<PlayerPositionsProps> = ({
  playerPaths,
  players,
  currentTick,
  xResolution,
  yResolution,
  heroes,
  renderPlayerDot,
}) => {
  return (
    <>
      {playerPaths.map((player) => {
        const playerInfo = players?.find(
          (p: PlayerInfo) => p.player_slot === player.player_slot
        );
        if (!playerInfo) return null;
        const hero = heroes.find((h) => h.id === playerInfo.hero_id);
        const heroName = hero?.name || `Hero ${playerInfo.hero_id}`;
        const minimapImg = hero?.images?.minimap_image_webp;
        const team = playerInfo.team;
        // NOTE: If we don't have a minimap image, we use the color based on the team
        const color = team === 0 ? "rgba(0,128,255,0.7)" : "rgba(0,200,0,0.7)";
        const playerX = player.x_pos[currentTick];
        const playerY = player.y_pos[currentTick];
        const x_max = player.x_max;
        const x_min = player.x_min;
        const y_max = player.y_max;
        const y_min = player.y_min;
        if (playerX !== undefined && playerY !== undefined) {
          const { left, top } = getPlayerMinimapPosition(
            x_max,
            x_min,
            y_max,
            y_min,
            playerX,
            playerY,
            playerPaths,
            xResolution,
            yResolution,
            renderPlayerDot
          );
          return minimapImg ?
              <img
                key={`${heroName} Player-${player.player_slot}`}
                title={`${heroName} Player ${player.player_slot} left: ${left} top: ${top}`}
                src={minimapImg}
                alt={`${heroName}`}
                className='pointer-events-auto absolute z-[99] h-[20px] w-[20px] translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white object-contain'
                style={{ left, top, background: color }}
              />
            : <div
                key={`${heroName} Player-${player.player_slot}`}
                title={`${heroName} Player ${player.player_slot}`}
                className='pointer-events-auto absolute z-2 h-[10px] w-[10px] translate-x-1/2 translate-y-1/2 rounded-full border-2 border-red-600'
                style={{ left, top, backgroundColor: color }}
              />;
        }
        return null;
      })}
    </>
  );
};

export function standardizePlayerPosition(
  x_max: number,
  x_min: number,
  y_max: number,
  y_min: number,
  playerX: number,
  playerY: number,
  playerPaths: Array<PlayerPathState>,
  xResolution: number,
  yResolution: number
): { standPlayerX: number; standPlayerY: number } {
  // Normalize player position to (0,1) range based on the minimap dimensions
  // and the player paths' min/max coordinates
  const normPlayerX = x_min + (playerX / xResolution) * (x_max - x_min);
  const normPlayerY = y_min + (playerY / yResolution) * (y_max - y_min);

  // Find the min/max coordinates across all player paths
  // to scale the normalized position correctly
  const allPlayerXMin = Math.min(
    ...playerPaths.map((p: PlayerPathState) => p.x_min)
  );
  const allPlayerXMax = Math.max(
    ...playerPaths.map((p: PlayerPathState) => p.x_max)
  );
  const allPlayerYMin = Math.min(
    ...playerPaths.map((p: PlayerPathState) => p.y_min)
  );
  const allPlayerYMax = Math.max(
    ...playerPaths.map((p: PlayerPathState) => p.y_max)
  );

  // Scale the normalized position to (0,1) range based on the overall min/max
  // This ensures that the player position is correctly represented on the minimap
  const scaledPlayerX =
    (normPlayerX - allPlayerXMin) / (allPlayerXMax - allPlayerXMin);
  const scaledPlayerY =
    (normPlayerY - allPlayerYMin) / (allPlayerYMax - allPlayerYMin);
  return { standPlayerX: scaledPlayerX, standPlayerY: 1 - scaledPlayerY };
}

export function getPlayerMinimapPosition(
  x_max: number,
  x_min: number,
  y_max: number,
  y_min: number,
  playerX: number,
  playerY: number,
  playerPaths: Array<PlayerPathState>,
  xResolution: number,
  yResolution: number,
  renderPlayerDot: (x: number, y: number) => { left: number; top: number }
): { left: number; top: number } {
  const { standPlayerX, standPlayerY } = standardizePlayerPosition(
    x_max,
    x_min,
    y_max,
    y_min,
    playerX,
    playerY,
    playerPaths,
    xResolution,
    yResolution
  );
  return renderPlayerDot(standPlayerX, standPlayerY);
}

export default PlayerPositions;
