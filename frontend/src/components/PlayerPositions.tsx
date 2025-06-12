import React from 'react';
import { PlayerPath } from '../types/PlayerPath';
import { PlayerInfo } from '../types/PlayerInfo';

interface PlayerPositionsProps {
  playerPaths: PlayerPath[];
  players: PlayerInfo[];
  currentTick: number; // Rename to currentTime for clarity
  xResolution: number;
  yResolution: number;
  renderPlayerDot: (x: number, y: number) => { left: number; top: number };
  getPlayerMinimapPosition: (args: {
    player: any;
    playerX: number;
    playerY: number;
    playerPaths: any[];
    xResolution: number;
    yResolution: number;
    renderPlayerDot: (x: number, y: number) => { left: number; top: number };
  }) => { left: number; top: number };
}

const PlayerPositions: React.FC<PlayerPositionsProps> = ({
  playerPaths,
  players,
  currentTick: currentTime,
  xResolution,
  yResolution,
  renderPlayerDot,
  getPlayerMinimapPosition,
}) => {
  return (
    <>
      {playerPaths.map(player => {
        const playerInfo = players?.find((p: PlayerInfo) => p.player_slot === player.player_slot);
        const team = playerInfo ? playerInfo.team : 0;
        const color = team === 0 ? 'rgba(0,128,255,0.7)' : 'rgba(0,200,0,0.7)';
        const x = player.x_pos?.[currentTime];
        const y = player.y_pos?.[currentTime];
        if (x !== undefined && y !== undefined) {
          const { left, top } = getPlayerMinimapPosition({
            player,
            playerX: x,
            playerY: y,
            playerPaths,
            xResolution,
            yResolution,
            renderPlayerDot,
          });
          return (
            <div
              key={`player-${player.player_slot}-tick-${currentTime}`}
              title={`Player ${player.player_slot} t=${currentTime}`}
              style={{
                position: 'absolute',
                left,
                top,
                width: 10,
                height: 10,
                backgroundColor: color,
                borderRadius: '50%',
                border: '2px solid #fff',
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

export default PlayerPositions;
