import React from 'react';
import { PlayerPath } from '../types/PlayerPath';
import { PlayerInfo } from '../types/PlayerInfo';
import { getPlayerMinimapPosition } from './Minimap';

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
          const { left, top } = getPlayerMinimapPosition({
            player,
            playerX,
            playerY,
            playerPaths,
            xResolution,
            yResolution,
            renderPlayerDot,
          });

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
                pointerEvents: 'auto',
                zIndex: 2,
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
