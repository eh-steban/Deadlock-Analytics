import React from 'react';

interface GridProps {
  MINIMAP_SIZE: number;
}

const Grid: React.FC<GridProps> = ({ MINIMAP_SIZE }) => (
  <svg
    width={MINIMAP_SIZE}
    height={MINIMAP_SIZE}
    style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'none' }}
  >
    {[...Array(21)].map((_, i) => (
      <g key={i}>
        {/* Vertical lines */}
        <line
          x1={(i / 20) * MINIMAP_SIZE}
          y1={0}
          x2={(i / 20) * MINIMAP_SIZE}
          y2={MINIMAP_SIZE}
          stroke="#bbb"
          strokeDasharray="2,2"
          strokeWidth={i % 5 === 0 ? 1.5 : 0.7}
          opacity={i % 5 === 0 ? 0.35 : 0.18}
        />
        {/* Horizontal lines */}
        <line
          x1={0}
          y1={(i / 20) * MINIMAP_SIZE}
          x2={MINIMAP_SIZE}
          y2={(i / 20) * MINIMAP_SIZE}
          stroke="#bbb"
          strokeDasharray="2,2"
          strokeWidth={i % 5 === 0 ? 1.5 : 0.7}
          opacity={i % 5 === 0 ? 0.35 : 0.18}
        />
        {/* Axis labels (every 5th line, except 0) */}
        {i % 5 === 0 && i !== 0 && (
          <>
            {/* X-axis: left to right, 0 to 1 */}
            <text
              x={(i / 20) * MINIMAP_SIZE + 2}
              y={12}
              fontSize="11"
              fill="#888"
            >
              {(i / 20).toFixed(2)}
            </text>
            {/* Y-axis: top to bottom, 0 to 1 */}
            <text
              x={4}
              y={(i / 20) * MINIMAP_SIZE - 2}
              fontSize="11"
              fill="#888"
            >
              {(i / 20).toFixed(2)}
            </text>
          </>
        )}
      </g>
    ))}
    {/* (0,1) bottom left */}
    <circle cx={0} cy={MINIMAP_SIZE} r={7} fill="#e00" stroke="#fff" strokeWidth={2} />
    <text x={12} y={MINIMAP_SIZE - 8} fontSize="12" fill="#e00">(0,1)</text>
    {/* (1,0) top right */}
    <circle cx={MINIMAP_SIZE} cy={0} r={7} fill="#00e" stroke="#fff" strokeWidth={2} />
    <text x={MINIMAP_SIZE - 44} y={18} fontSize="12" fill="#00e">(1,0)</text>
    {/* Center */}
    <circle cx={MINIMAP_SIZE/2} cy={MINIMAP_SIZE/2} r={7} fill="#0a0" stroke="#fff" strokeWidth={2} />
    <text x={MINIMAP_SIZE/2 + 10} y={MINIMAP_SIZE/2 - 10} fontSize="12" fill="#0a0">center</text>
  </svg>
);

export default Grid;
