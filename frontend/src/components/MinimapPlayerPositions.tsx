import React from 'react';
import { PlayerPath } from '../types/PlayerPath';
import { PlayerInfo } from '../types/PlayerInfo';

interface MinimapPlayerPositionsProps {
  playerPaths: PlayerPath[];
  matchData: any;
  currentTime: number;
  xResolution: number;
  yResolution: number;
  renderPlayerDot: (x: number, y: number) => { left: number; top: number };
}

const MinimapPlayerPositions: React.FC<MinimapPlayerPositionsProps> = ({
  playerPaths,
  matchData,
  currentTime,
  xResolution,
  yResolution,
  renderPlayerDot,
}) => {
  return (
    <>
      {playerPaths.map(player => {
        const playerInfo = matchData.match_info.players?.find((p: PlayerInfo) => p.player_slot === player.player_slot);
        const team = playerInfo ? playerInfo.team : 0;
        const color = team === 0 ? 'rgb(4, 0, 255)' : 'rgb(3, 100, 3)';
        const playerX = player.x_pos[currentTime];
        const playerY = player.y_pos[currentTime];
        if (playerX !== undefined && playerY !== undefined) {
          const normPlayerX = player.x_min + (playerX / xResolution) * (player.x_max - player.x_min);
          const normPlayerY = player.y_min + (playerY / yResolution) * (player.y_max - player.y_min);

          const allPlayerXMin = Math.min(...playerPaths.map(p => p.x_min));
          const allPlayerXMax = Math.max(...playerPaths.map(p => p.x_max));
          const allPlayerYMin = Math.min(...playerPaths.map(p => p.y_min));
          const allPlayerYMax = Math.max(...playerPaths.map(p => p.y_max));

          const scaledPlayerX = ((normPlayerX - allPlayerXMin) / (allPlayerXMax - allPlayerXMin));
          const scaledPlayerY = ((normPlayerY - allPlayerYMin) / (allPlayerYMax - allPlayerYMin));

          const { left, top } = renderPlayerDot(scaledPlayerX, scaledPlayerY);

          return (
            <div
              key={`player-${player.player_slot}-current`}
              title={`Player ${player.player_slot} at currentTime`}
              style={{
                position: 'absolute',
                left,
                top,
                width: 10,
                height: 10,
                backgroundColor: color,
                borderRadius: '50%',
                border: '2px solid #ff0000',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          );
        }
        return null;
      })}
    </>
  );
};

export default MinimapPlayerPositions;
