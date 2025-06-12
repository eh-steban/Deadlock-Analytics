import React from 'react';
import { PlayerPath } from '../types/PlayerPath';
import { PlayerInfo } from '../types/PlayerInfo';
import { Hero } from '../types/Hero';

interface PlayerCardsProps {
  playerPaths: PlayerPath[];
  players: PlayerInfo[];
  currentTime: number;
  heros: Hero[];
}

enum MoveType {
  Normal = 0,
  Ability = 1,
  AbilityDebuff = 2,
  GroundDash = 3,
  Slide = 4,
  RopeClimbing = 5,
  Ziplining = 6,
  InAir = 7,
  AirDash = 8,
}

const PlayerCards: React.FC<PlayerCardsProps> = ({ playerPaths, players, currentTime, heros }) => {
  return (
    <>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>Player Info</h3>
      <div title='playerCards' style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', background: 'none', border: 'none', borderRadius: 0, padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1%', width: '100%' }}>
        {playerPaths.map(player => {
          const playerInfo = players?.find((p: PlayerInfo) => p.player_slot === player.player_slot);
          if (!playerInfo) return null;
          const team = playerInfo.team;
          const heroName = heros.find(h => h.id === playerInfo.hero_id)?.name || `Hero ${playerInfo.hero_id}`;
          const health = player.health?.[currentTime];
          const moveType = player.move_type?.[currentTime];
          const moveTypeLabel = moveType !== undefined && MoveType[moveType] !== undefined ? MoveType[moveType] : moveType;
          const combatTypes = player.combat_type?.slice(currentTime, currentTime + 1) || [];
          const combatTypeSet = Array.from(new Set(combatTypes.filter(x => x !== undefined)));
          const combatTypeLabels = ["Out of Combat", "Player", "Enemy NPC", "Neutral"];
          const combatTypeLabelList = combatTypeSet.map(type => combatTypeLabels[type] || type).join(', ');
          return (
            <div key={`player-card-${player.player_slot}`} style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, padding: '0.5rem 0.75rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontWeight: 600, fontSize: '1.05em', marginBottom: 2 }}>{heroName} <span style={{ color: '#888', fontWeight: 400, fontSize: '0.95em' }}>(Slot {player.player_slot}, Team {team})</span></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.97em' }}>
                <div><strong>Health:</strong> {health !== undefined ? health : '-'}</div>
                <div><strong>Move Type:</strong> {moveTypeLabel !== undefined ? moveTypeLabel : '-'}</div>
                <div><strong>Combat Type:</strong> {combatTypeLabelList || '-'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PlayerCards;
