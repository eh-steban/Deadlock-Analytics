import React from 'react';
import { StatType } from '../../types/StatType';

interface DamageSourceTypesTableProps {
  sourceDetails: {
    stat_type: number[];
    source_name: string[];
  } | undefined;
}

const DamageSourceTypesTable: React.FC<DamageSourceTypesTableProps> = ({ sourceDetails }) => {
  if (!sourceDetails || !sourceDetails.stat_type || !sourceDetails.source_name) {
    return <div>No damage source details available.</div>;
  }

  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '2rem', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
      <h4>Damage Source Types</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: '0.95em' }}>
        <thead>
          <tr style={{ background: '#f7f7f7' }}>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Index</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Stat Type (Label)</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Stat Type (Number)</th>
            <th style={{ border: '1px solid #ccc', padding: '2px 6px' }}>Source Name</th>
          </tr>
        </thead>
        <tbody>
          {sourceDetails.stat_type.map((statTypeNum: number, idx: number) => (
            <tr key={`source-detail-row-${idx}`} style={{ background: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{idx}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{StatType[statTypeNum] !== undefined ? StatType[statTypeNum] : statTypeNum}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{statTypeNum}</td>
              <td style={{ border: '1px solid #ccc', padding: '2px 6px' }}>{sourceDetails.source_name[idx]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DamageSourceTypesTable;
