import React from 'react';
import { PlayerPath } from '../../types/PlayerPath';
import { PlayerInfo } from '../../types/PlayerInfo';
import { StatType } from '../../types/StatType';

interface DamageMatrixTableProps {
  matchData: any;
}

const DamageMatrixTable: React.FC<DamageMatrixTableProps> = ({ matchData }) => {
  const { sample_time_s, damage_dealers, source_details } = matchData.match_info.damage_matrix;
  const { stat_type, source_name } = source_details;
  // Only dealer_player_slot 1 (Abrams)
  const dealer = (damage_dealers || []).find((d: any) => d.dealer_player_slot === 1);
  if (!dealer) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>No damage data for Abrams (player_slot 1).</div>
    );
  }
  let rows: any[] = [];
  (sample_time_s || []).forEach((sampleTime: number, sampleIdx: number) => {
    if (sampleTime > 1080) return;
    let sources = dealer.damage_sources || [];
    // Fix: Only treat as 2D if first element is an array and not empty
    if (Array.isArray(sources) && sources.length > 0 && Array.isArray(sources[0])) {
      sources = (sources as any[][])[sampleIdx] || [];
    }
    (sources || []).forEach((src: any) => {
      const srcIdx = src.source_details_index;
      const srcName = source_name[srcIdx];
      const srcStatType = stat_type[srcIdx];
      const srcStatTypeLabel = StatType[srcStatType] !== undefined ? StatType[srcStatType] : srcStatType;
      (src.damage_to_players || []).forEach((dtp: any) => {
        const target = dtp.target_player_slot !== undefined ? dtp.target_player_slot : '-';
        const dmg = Array.isArray(dtp.damage) ? dtp.damage[sampleIdx] : undefined;
        if (dmg !== undefined && dmg > 0) {
          rows.push({
            sampleTime,
            srcIdx,
            srcName,
            srcStatType,
            srcStatTypeLabel,
            target,
            dmg
          });
        }
      });
    });
  });
  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>No damage matrix rows for Abrams in this time window.</div>
    );
  }
  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '2rem', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
      <h4>Damage Matrix (Dealer: Abrams, player_slot 1, sample_time_s ≤ 1080)</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: '0.95em' }}>
        <thead>
          <tr style={{ background: '#f7f7f7' }}>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Sample Time (s)</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Source (Index, Label, Stat Type, Stat Label)</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Target Player</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Damage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`abrams-dmg-matrix-${idx}`} style={{ background: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{row.sampleTime}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{row.srcIdx} - {row.srcName} ({row.srcStatType}, {row.srcStatTypeLabel})</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{row.target}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{row.dmg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DamageMatrixTable;
