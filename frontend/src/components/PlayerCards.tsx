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
      <div title='playerCards' style={{ overflowY: 'auto', background: 'none', border: 'none', borderRadius: 0, padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%' }}>
        {playerPaths.map(player => {
          const playerInfo = players.find((p: any) => p.player_slot === player.player_slot);
          if (!playerInfo) return null;
          const team = playerInfo.team;
          const hero = heros.find((h: any) => h.id === playerInfo.hero_id);
          const heroName = hero ? hero.name : `Hero ${playerInfo.hero_id}`;
          const heroImg = hero && hero.images && hero.images.icon_hero_card_webp;
          const health = player.health[currentTime];
          const moveType = player.move_type[currentTime];
          const moveTypeLabel = moveType !== undefined && MoveType[moveType] !== undefined ? MoveType[moveType] : moveType;
          const combatTypes = player.combat_type.slice(currentTime, currentTime + 1) || [];
          const combatTypeSet = Array.from(new Set(combatTypes.filter(x => x !== undefined)));
          const combatTypeLabels = ["Out of Combat", "Player", "Enemy NPC", "Neutral"];
          const combatTypeLabelList = combatTypeSet.map(type => combatTypeLabels[type] || type).join(', ');
          return (
            <div key={`player-card-${player.player_slot}`} style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', boxShadow: '0 0.0625rem 0.125rem rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.625rem' }}>
              {heroImg && (
                <img src={heroImg} alt={heroName} style={{ width: '4rem', height: '4rem', borderRadius: '1rem', objectFit: 'cover', background: '#eee', border: '1px solid #ddd' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1.05em', marginBottom: '0.125rem' }}>{heroName} <span style={{ color: '#888', fontWeight: 400, fontSize: '0.95em' }}>(Slot {player.player_slot}, Team {team})</span></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.97em' }}>
                  <div><strong>Health:</strong> {health !== undefined ? health : '-'}</div>
                  <br/>
                  <div><strong>Move Type:</strong> {moveTypeLabel !== undefined ? moveTypeLabel : '-'}</div>
                  <br/>
                  <div><strong>Combat Type:</strong> {combatTypeLabelList || '-'}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PlayerCards;
