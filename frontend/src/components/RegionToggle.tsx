import React from 'react';

interface RegionToggleProps {
  regions: { label: string }[];
  visibleRegions: { [label: string]: boolean };
  onToggle: (label: string) => void;
}

const RegionToggle: React.FC<RegionToggleProps> = ({ regions, visibleRegions, onToggle }) => (
  <div style={{ width: '100%', background: '#fff', padding: '8px 0', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderTop: '1px solid #eee', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
    {regions.map(region => (
      <label key={region.label} style={{ fontSize: 13, userSelect: 'none', marginRight: 8, marginBottom: 2 }}>
        <input
          type="checkbox"
          checked={visibleRegions[region.label]}
          onChange={() => onToggle(region.label)}
          style={{ marginRight: 6 }}
        />
        {region.label}
      </label>
    ))}
  </div>
);

export default RegionToggle;
