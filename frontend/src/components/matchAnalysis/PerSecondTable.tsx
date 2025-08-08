import React from 'react';
import { PlayerPathState } from '../../types/Player';

interface PerSecondTableProps {
  playerPaths: PlayerPathState[];
}

/**
 * Per-Second Data Table for player_slot 1 (Abrams)
 * Shows time, (x, y), health, combat type, and move type for each second.
 */
const PerSecondTable: React.FC<PerSecondTableProps> = ({ playerPaths }) => {
  // Find player path for player_slot 1 (Abrams)
  const abramPath = playerPaths.find(p => p.player_slot === 1);
  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '2rem', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
      <h4>Per-Second Data for Abrams (player_slot 1)</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: '0.95em' }}>
        <thead>
          <tr style={{ background: '#f7f7f7', position: 'sticky', top: 0, zIndex: 2 }}>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px', background: '#f7f7f7', position: 'sticky', top: 0, zIndex: 3 }}>Time (s)</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px', background: '#f7f7f7', position: 'sticky', top: 0, zIndex: 3 }}>(X, Y)</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px', background: '#f7f7f7', position: 'sticky', top: 0, zIndex: 3 }}>Health</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px', background: '#f7f7f7', position: 'sticky', top: 0, zIndex: 3 }}>Combat Type</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px', background: '#f7f7f7', position: 'sticky', top: 0, zIndex: 3 }}>Move Type</th>
          </tr>
        </thead>
        <tbody>
          {!abramPath ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>No data for player_slot 1 (Abrams).</td></tr>
          ) : abramPath.x_pos.map((x: number, idx: number) => {
            const y = abramPath.y_pos[idx];
            const health = abramPath.health[idx];
            const combatType = abramPath.combat_type[idx];
            const moveType = abramPath.move_type[idx];
            return (
              <tr key={`abrams-persec-${idx}`} style={{ background: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{idx}</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{x !== undefined && y !== undefined ? `(${x}, ${y})` : '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{health !== undefined ? health : '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{combatType !== undefined ? combatType : '-'}</td>
                <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{moveType !== undefined ? moveType : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PerSecondTable;
