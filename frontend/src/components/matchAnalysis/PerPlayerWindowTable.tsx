import React from 'react';
import { PlayerPathState, PlayerInfo } from '../../types/Player';

interface PerPlayerWindowTableProps {
  playerPaths: PlayerPathState[];
  matchData: any;
  playerTime: number;
  heros: { [key: number]: string };
}

const PerPlayerWindowTable: React.FC<PerPlayerWindowTableProps> = ({ playerPaths, matchData, playerTime, heros }) => {
  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '2rem', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
      <h4>Player Data (60s Window)</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: '0.95em' }}>
        <thead>
          <tr style={{ background: '#f7f7f7' }}>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Hero</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Player Slot</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Team</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Time Window</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Combat Types</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Combat Type Counts</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Health Range</th>
          </tr>
        </thead>
        <tbody>
          {playerPaths.map(player => {
            const playerInfo = matchData.match_info.players?.find((p: PlayerInfo) => p.player_slot === player.player_slot);
            if (!playerInfo) return null;
            const team = playerInfo.team;
            const heroName = heros[playerInfo.hero_id] || `Hero ${playerInfo.hero_id}`;
            const windowStart = playerTime;
            const windowEnd = playerTime + 60;
            const moveTypes = player.move_type.slice(windowStart, windowEnd) || [];
            const healths = player.health.slice(windowStart, windowEnd) || [];
            const combatTypes = player.combat_type.slice(windowStart, windowEnd) || [];
            if (moveTypes.length === 0 && healths.length === 0 && combatTypes.length === 0) return null;
            const combatTypeSet = Array.from(new Set(combatTypes.filter(x => x !== undefined)));
            const combatTypeLabels = ["Out of Combat", "Player", "Enemy NPC", "Neutral"];
            const combatTypeLabelList = combatTypeSet.map(type => combatTypeLabels[type] || type).join(', ');
            const minHealth = Math.min(...healths.filter(x => x !== undefined));
            const maxHealth = Math.max(...healths.filter(x => x !== undefined));
            const combatTypeCounts: { [key: number]: number } = {};
            combatTypes.forEach(type => {
              if (type !== undefined) combatTypeCounts[type] = (combatTypeCounts[type] || 0) + 1;
            });
            return (
              <tr key={`player-agg-row-${player.player_slot}`}
                style={{ background: '#e6f7ff', fontWeight: 'bold' }}>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{heroName}</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{player.player_slot}</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{team}</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>[{windowStart} - {windowEnd - 1}]</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{combatTypeLabelList}</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{combatTypeSet.map(type => `${combatTypeLabels[type] || type}: ${combatTypeCounts[type] || 0}`).join(', ')}</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{minHealth} - {maxHealth}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PerPlayerWindowTable;
