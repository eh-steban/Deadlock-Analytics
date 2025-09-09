import React from "react";
import { Region } from "../../types/Region";

interface RegionsMappingProps {
  MINIMAP_SIZE: number;
  regions: Region[];
}

const RegionsMapping: React.FC<RegionsMappingProps> = ({
  MINIMAP_SIZE,
  regions: regionsProp,
}) => {
  const regionList: Region[] = regionsProp;
  return (
    <svg
      className={`pointer-events-auto absolute inset-0 top-0 left-0 z-3 h-full w-full`}
      viewBox={`0 0 ${MINIMAP_SIZE} ${MINIMAP_SIZE}`}
    >
      {regionList.map((region: Region) => {
        const xs = region.polygon.map(([x]) => x * MINIMAP_SIZE);
        const ys = region.polygon.map(([, y]) => y * MINIMAP_SIZE);
        const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
        const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
        return (
          <g key={region.label}>
            <polygon
              points={region.polygon
                .map(([x, y]) => `${x * MINIMAP_SIZE},${y * MINIMAP_SIZE}`)
                .join(" ")}
              fill={region.color}
              stroke={region.border}
              strokeWidth={2}
            />
            <text
              x={cx}
              y={cy}
              fontSize={15}
              fill='#333'
              fontWeight='bold'
              textAnchor='middle'
              alignmentBaseline='middle'
              style={{ pointerEvents: "none" }}
            >
              {region.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default RegionsMapping;
