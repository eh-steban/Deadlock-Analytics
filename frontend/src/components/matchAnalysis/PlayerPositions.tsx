import React, { useMemo } from "react";
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
  xResolution: number;
  yResolution: number;
  heroes: Hero[];
  renderPlayerDot: (x: number, y: number) => { left: number; top: number };
}

const PlayerPositions: React.FC<PlayerPositionsProps> = ({
  // playerPositions,
  perPlayerData,
  playersData,
  currentTick,
  xResolution,
  yResolution,
  heroes,
  renderPlayerDot,
}) => {
  const playerPositions: PositionWindow[] = Object.entries(perPlayerData).map(
    ([playerIdx, playerGameData]) => playerGameData.positions
  );

  const allPlayerBounds = useMemo(
    () => computeAllPlayerBounds(playerPositions),
    [playerPositions]
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
          const { left, top } = getPlayerMinimapPosition(
            playerPos,
            allPlayerBounds,
            xResolution,
            yResolution,
            renderPlayerDot
          );
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

export function computeAllPlayerBounds(playerPositions: PositionWindow[]) {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const pdata of playerPositions) {
    for (const pos of pdata) {
      if (!pos) continue;
      if (pos.x < xMin) xMin = pos.x;
      if (pos.x > xMax) xMax = pos.x;
      if (pos.y < yMin) yMin = pos.y;
      if (pos.y > yMax) yMax = pos.y;
    }
  }

  // NOTE: These values came from the Haste github.
  // This might be more reliable than computing from player data
  // since players might not cover the entire map area.
  // m_pGameRules.m_vMinimapMins:Vector = [-8960.0, -8960.005, 0.0]
  // m_pGameRules.m_vMinimapMaxs:Vector = [8960.0, 8960.0, 0.0]
  // return { xMin: -8960, xMax: 8960, yMin: -8960, yMax: 8960 };
  return { xMin, xMax, yMin, yMax };
}

export function scalePlayerPosition(
  playerPos: PlayerPosition,
  allPlayerBounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  },
  xResolution: number,
  yResolution: number
): { scaledPlayerX: number; scaledPlayerY: number } {
  // Scale the normalized position to (0, MAP_SIZE) range based on the overall min/max
  // This ensures that the player position is correctly represented on the minimap
  const scaledPlayerX =
    (playerPos.x - allPlayerBounds.xMin) /
    (allPlayerBounds.xMax - allPlayerBounds.xMin);
  const scaledPlayerY =
    (playerPos.y - allPlayerBounds.yMin) /
    (allPlayerBounds.yMax - allPlayerBounds.yMin);

  return { scaledPlayerX: scaledPlayerX, scaledPlayerY: scaledPlayerY };
}

export function getPlayerMinimapPosition(
  playerPos: PlayerPosition,
  allPlayerBounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  },
  xResolution: number,
  yResolution: number,
  renderPlayerDot: (x: number, y: number) => { left: number; top: number }
): { left: number; top: number } {
  const { scaledPlayerX, scaledPlayerY } = scalePlayerPosition(
    playerPos,
    allPlayerBounds,
    xResolution,
    yResolution
  );
  return renderPlayerDot(scaledPlayerX, scaledPlayerY);
}

export default PlayerPositions;
