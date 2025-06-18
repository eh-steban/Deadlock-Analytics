import React from 'react';
import { PlayerPath } from '../types/PlayerPath';
import { PlayerInfo } from '../types/PlayerInfo';
import { Hero } from '../types/Hero';

interface PlayerPositionsProps {
  playerPaths: PlayerPath[];
  players: PlayerInfo[];
  currentTime: number;
  xResolution: number;
  yResolution: number;
  heros: Hero[];
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
  currentTime,
  xResolution,
  yResolution,
  heros,
  renderPlayerDot,
  getPlayerMinimapPosition,
}) => {
  return (
    <>
      {playerPaths.map(player => {
        const playerInfo = players?.find((p: PlayerInfo) => p.player_slot === player.player_slot);
        if (!playerInfo) return null;
        const hero = heros.find(h => h.id === playerInfo.hero_id);
        const heroName = hero?.name || `Hero ${playerInfo.hero_id}`;
        const minimapImg = hero?.images?.minimap_image_webp;
        const team = playerInfo.team;
        // NOTE: If we don't have a minimap image, we use the color based on the team
        const color = team === 0 ? 'rgba(0,128,255,0.7)' : 'rgba(0,200,0,0.7)';
        const playerX = player.x_pos[currentTime];
        const playerY = player.y_pos[currentTime];
        if (playerX !== undefined && playerY!== undefined) {
          const { left, top } = getPlayerMinimapPosition({
            player,
            playerX,
            playerY,
            playerPaths,
            xResolution,
            yResolution,
            renderPlayerDot,
          });
          return minimapImg ? (
            <img
              key={`${heroName} Player-${player.player_slot}`}
              title={`${heroName} Player ${player.player_slot}`}
              src={minimapImg}
              alt={heroName}
              style={{
                position: 'absolute',
                left,
                top,
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '2px solid #fff',
                pointerEvents: 'auto',
                zIndex: 2,
                background: color,
                objectFit: 'contain',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ) : (
            <div
              key={`${heroName} Player-${player.player_slot}`}
              title={`${heroName} Player ${player.player_slot}`}
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

export default PlayerPositions;
