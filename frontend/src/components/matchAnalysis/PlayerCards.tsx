import React from 'react';
import { ParsedGameData, DamageRecord } from '../../types/MatchAnalysis';
import { NPC, Player } from '../../types/Player';

interface PlayerCardsProps {
  players: Player[];
  npcs: NPC[];
  currentTime: number;
  gameData: ParsedGameData;
  getPlayerRegionLabels: (
    x_max: number,
    x_min: number,
    y_max: number,
    y_min: number,
    playerX: number,
    playerY: number,
  ) => string[];
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

const PlayerCards: React.FC<PlayerCardsProps> = ({
  players,
  npcs,
  currentTime,
  gameData,
  getPlayerRegionLabels
}) => {
  return (
    <>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>Player Info</h3>
      <div title='playerCards' style={{
        overflowY: 'auto',
        background: 'none',
        border: 'none',
        borderRadius: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        width: '100%',
        gap: '0.25rem'
      }}>
        {players.map(player => {
          const playerInfo = player.player_info
          const playerPathState = player.path_state;
          const team = playerInfo.team;
          const hero = player.hero;
          const heroName = hero ? hero.name : `Hero ${playerInfo.hero_id}`;
          const heroImg = hero && hero.images && hero.images.icon_hero_card_webp;
          const health = playerPathState.health[currentTime];
          const moveType = playerPathState.move_type[currentTime];
          const moveTypeLabel = moveType !== undefined && MoveType[moveType] !== undefined ? MoveType[moveType] : moveType;
          const combatTypes = playerPathState.combat_type.slice(currentTime, currentTime + 1) || [];
          const combatTypeSet = Array.from(new Set(combatTypes.filter(x => x !== undefined)));
          const combatTypeLabels = ["Out of Combat", "Player", "Enemy NPC", "Neutral"];
          const combatTypeLabelList = combatTypeSet.map(type => combatTypeLabels[type] || type).join(', ');
          const regionLabels: string[] = getPlayerRegionLabels(
            playerPathState.x_max,
            playerPathState.x_min,
            playerPathState.y_max,
            playerPathState.y_min,
            playerPathState.x_pos[currentTime],
            playerPathState.y_pos[currentTime],
          );

          console.log('Player:', player);
          console.log("currentTime: ", currentTime);

          const damageWindow = gameData.damage_per_tick[currentTime] || {};

          // If found, get the victim map for this attacker
          const attackerVictimMap = damageWindow[player.custom_id];

          console.log('damageWindow[player.custom_id]:', damageWindow[player.custom_id]);
          console.log('Damage Window:', damageWindow);
          console.log('Attacker Victim Map:', attackerVictimMap);

          return (
            <div key={`player-card-${playerInfo.player_slot}`} style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', boxShadow: '0 0.0625rem 0.125rem rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: '0.025rem' }}>
              {heroImg && (
                <img src={heroImg} alt={heroName} style={{ width: '4rem', height: '4rem', borderRadius: '1rem', objectFit: 'cover', background: '#eee', border: '1px solid #ddd' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1.05em', marginBottom: '0.125rem' }}>{heroName} <span style={{ color: '#888', fontWeight: 400, fontSize: '0.95em' }}>(Slot {playerInfo.player_slot}, Team {team})</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.97em' }}>
                  <div><strong>Health:</strong> {health !== undefined ? health : '-'}</div>
                  <div><strong>Move Type:</strong> {moveTypeLabel !== undefined ? moveTypeLabel : '-'}</div>
                  <div><strong>Combat Type:</strong> {combatTypeLabelList || '-'}</div>
                  <div><strong>Current Region:</strong> {regionLabels.join(', ')}</div>
                  <div><strong>Victims:</strong>
                    {attackerVictimMap && Object.entries(attackerVictimMap).length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {Object.entries(attackerVictimMap).map(([victimIdx, damageRecords]) => {
                          const victimPlayer = players[Number(victimIdx)];
                          return (
                            <li key={victimIdx}>
                              {victimPlayer ? victimPlayer.name : `Victim ${victimIdx}`}
                              <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {damageRecords.map((rec, idx) => (
                                  <li key={idx}>
                                    Damage: {rec.damage}, Type: {rec.type}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      '-'
                    )}
                  </div>
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
