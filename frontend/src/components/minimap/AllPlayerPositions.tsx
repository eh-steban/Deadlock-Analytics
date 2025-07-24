import React from 'react';
import { PlayerPath } from '../../types/PlayerPath';
import { getPlayerMinimapPosition } from './PlayerPositions';

interface AllPlayerPositionsProps {
  playerPaths: PlayerPath[];
  matchData: any;
  xResolution: number;
  yResolution: number;
  renderPlayerDot: (x: number, y: number) => { left: number; top: number };
}

const AllPlayerPositions: React.FC<AllPlayerPositionsProps> = ({
  playerPaths,
  matchData,
  xResolution,
  yResolution,
  renderPlayerDot,
}) => {
  return (
    <>
      {playerPaths.map(player => {
        const playerInfo = matchData.match_info.players?.find((p: any) => p.player_slot === player.player_slot);
        const team = playerInfo ? playerInfo.team : 0;
        const color = team === 0 ? 'rgba(0,128,255,0.3)' : 'rgba(0,200,0,0.3)';
        const zipcolor = 'rgba(229, 255, 0, 0.45)';
        // Limit to first 2000 points per player to avoid stack issues
        const maxPoints = 2000;
        return player.x_pos.slice(0, maxPoints).map((playerX, idx) => {
          const playerY = player.y_pos[idx];
          const x_max = player.x_max;
          const x_min = player.x_min;
          const y_max = player.y_max;
          const y_min = player.y_min;
          const moveType = player.move_type[idx];
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
              renderPlayerDot,
            );

            return (
              <div
                key={`player-${player.player_slot}-pt-${idx}`}
                title={`Player ${player.player_slot} t=${idx}`}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width: 6,
                  height: 6,
                  backgroundColor: moveType !== 6 ? color : zipcolor,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  float: 'right',
                }}
              />
            );
          }
          return null;
        });
      })}
    </>
  );
};

export default AllPlayerPositions;
