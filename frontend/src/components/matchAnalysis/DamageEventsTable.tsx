import React from 'react';
import { PlayerPath } from '../../types/PlayerPath';
import { PlayerInfo } from '../../types/PlayerInfo';

interface DamageEventsTableProps {
  matchData: any;
  heros: { [key: number]: string };
}

enum StatType {
  Damage = 0,
  Healing = 1,
  HealPrevented = 2,
  Mitigated = 3,
  LethalDamage = 4,
  Regen = 5
}

const DamageEventsTable: React.FC<DamageEventsTableProps> = ({ matchData, heros }) => {
  const { match_info } = matchData;
  const { damage_matrix, match_paths, players } = match_info;
  const { sample_time_s, damage_dealers, source_details } = damage_matrix;
  const { stat_type, source_name } = source_details;
  const playerPathMap: { [slot: number]: PlayerPath } = {};
  (match_paths.paths || []).forEach((p: PlayerPath) => { playerPathMap[p.player_slot] = p; });
  const playerInfoMap: { [slot: number]: PlayerInfo } = {};
  (players || []).forEach((p: PlayerInfo) => { playerInfoMap[p.player_slot] = p; });
  let sampleWindow = 180;
  if (sample_time_s && sample_time_s.length > 1) {
    sampleWindow = sample_time_s[1] - sample_time_s[0];
  }
  const events: any[] = [];
  (sample_time_s || []).forEach((sampleTime: number, sampleIdx: number) => {
    const sampleStart = sampleTime;
    (damage_dealers || []).forEach((dealer: any) => {
      const dealerSlot = dealer.dealer_player_slot;
      const dealerPath = playerPathMap[dealerSlot];
      const dealerInfo = playerInfoMap[dealerSlot];
      const dealerHero = dealerInfo ? (heros[dealerInfo.hero_id] || `Hero ${dealerInfo.hero_id}`) : '-';
      const dealerX = dealerPath && dealerPath.x_pos[sampleStart] !== undefined ? dealerPath.x_pos[sampleStart] : undefined;
      const dealerY = dealerPath && dealerPath.y_pos[sampleStart] !== undefined ? dealerPath.y_pos[sampleStart] : undefined;
      const dealerCombatType = dealerPath && dealerPath.combat_type[sampleStart] !== undefined ? dealerPath.combat_type[sampleStart] : undefined;
      const dealerMoveType = dealerPath && dealerPath.move_type[sampleStart] !== undefined ? dealerPath.move_type[sampleStart] : undefined;
      let sources = dealer.damage_sources || [];
      if (Array.isArray(sources[0])) {
        sources = sources[sampleIdx] || [];
      }
      (sources || []).forEach((src: any) => {
        const srcIdx = src.source_details_index;
        const srcName = source_name[srcIdx];
        const srcStatType = stat_type[srcIdx];
        const srcStatTypeLabel = StatType[srcStatType] !== undefined ? StatType[srcStatType] : srcStatType;
        (src.damage_to_players || []).forEach((dtp: any) => {
          const targetSlot = dtp.target_player_slot;
          const targetPath = playerPathMap[targetSlot];
          const targetInfo = playerInfoMap[targetSlot];
          const targetHero = targetInfo ? (heros[targetInfo.hero_id] || `Hero ${targetInfo.hero_id}`) : '-';
          const targetX = targetPath && targetPath.x_pos[sampleStart] !== undefined ? targetPath.x_pos[sampleStart] : undefined;
          const targetY = targetPath && targetPath.y_pos[sampleStart] !== undefined ? targetPath.y_pos[sampleStart] : undefined;
          const targetCombatType = targetPath && targetPath.combat_type[sampleStart] !== undefined ? targetPath.combat_type[sampleStart] : undefined;
          const targetMoveType = targetPath && targetPath.move_type[sampleStart] !== undefined ? targetPath.move_type[sampleStart] : undefined;
          const dmg = Array.isArray(dtp.damage) ? dtp.damage[sampleIdx] : undefined;
          if (dmg !== undefined && dmg > 0) {
            events.push({
              t: sampleStart,
              dealerSlot,
              dealerHero,
              targetSlot,
              targetHero,
              dmg,
              srcName,
              srcStatTypeLabel,
              dealerX,
              dealerY,
              targetX,
              targetY,
              dealerCombatType,
              dealerMoveType,
              targetCombatType,
              targetMoveType
            });
          }
        });
      });
    });
  });
  events.sort((a, b) => a.t - b.t || a.dealerSlot - b.dealerSlot || a.targetSlot - b.targetSlot);
  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '2rem', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
      <h4>Damage Events (Current 60s Window)</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: '0.95em' }}>
        <thead>
          <tr style={{ background: '#f7f7f7' }}>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Time (s)</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Dealer Player Slot</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Dealer Hero</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Target Player Slot</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Target Hero</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Damage Amount</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Source Name</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Stat Type</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Dealer X</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Dealer Y</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Target X</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Target Y</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Dealer Combat Type</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Dealer Move Type</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Target Combat Type</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Target Move Type</th>
          </tr>
        </thead>
        <tbody>
          {events.length > 0 ? events.map((ev, idx) => (
            <tr key={`damage-event-row-${idx}`} style={{ background: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.t}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.dealerSlot}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.dealerHero}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.targetSlot}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.targetHero}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.dmg}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.srcName}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.srcStatTypeLabel}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.dealerX !== undefined ? ev.dealerX : '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.dealerY !== undefined ? ev.dealerY : '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.targetX !== undefined ? ev.targetX : '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.targetY !== undefined ? ev.targetY : '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.dealerCombatType !== undefined ? ev.dealerCombatType : '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.dealerMoveType !== undefined ? ev.dealerMoveType : '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.targetCombatType !== undefined ? ev.targetCombatType : '-'}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{ev.targetMoveType !== undefined ? ev.targetMoveType : '-'}</td>
            </tr>
          )) : (
            <tr><td colSpan={16} style={{ textAlign: 'center', padding: '1rem' }}>No damage events in this window.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DamageEventsTable;
