import React, { useRef, useState } from 'react';

const RADIUS = 10752;
const DIAMETER = RADIUS * 2;
const MINIMAP_SIZE = 512;
// TODO: Figure out if we need this constant
const API_URL = 'https://assets.deadlock-api.com/v1/map';

const Minimap = () => {
  const mapRef = useRef<HTMLImageElement>(null);
  const images = { minimap: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/maps/minimap.png' };
  const [error, setError] = useState(false);

  const objectiveCoordinates = [
    { label: 'Midboss', x: 0 * RADIUS, y: 0 * RADIUS },
    { label: 'team0_core', x: 0 * RADIUS, y: -0.75 * RADIUS },
    { label: 'team0_titan', x: 0 * RADIUS, y: -0.7 * RADIUS },
    { label: 'team0_tier1_1', x: -0.8 * RADIUS, y: -0.2 * RADIUS },
    { label: 'team0_tier2_1', x: -0.575 * RADIUS, y: -0.475 * RADIUS },
    { label: 'team0_tier3_1', x: -0.2 * RADIUS, y: -0.6 * RADIUS },
    { label: 'team0_tier1_2', x: 0.01 * RADIUS, y: -0.175 * RADIUS },
    { label: 'team0_tier2_2', x: -0.13 * RADIUS, y: -0.3 * RADIUS },
    { label: 'team0_tier3_2', x: 0 * RADIUS, y: -0.55 * RADIUS },
    { label: 'team0_tier1_3', x: 0.67 * RADIUS, y: -0.2 * RADIUS },
    { label: 'team0_tier2_3', x: 0.52 * RADIUS, y: -0.45 * RADIUS },
    { label: 'team0_tier3_3', x: 0.2 * RADIUS, y: -0.6 * RADIUS },
    { label: 'team1_core', x: 0 * RADIUS, y: 0.75 * RADIUS },
    { label: 'team1_titan', x: 0 * RADIUS, y: 0.7 * RADIUS },
    { label: 'team1_tier1_1', x: -0.67 * RADIUS, y: 0.2 * RADIUS },
    { label: 'team1_tier2_1', x: -0.52 * RADIUS, y: 0.475 * RADIUS },
    { label: 'team1_tier3_1', x: -0.2 * RADIUS, y: 0.6 * RADIUS },
    { label: 'team1_tier1_2', x: 0.01 * RADIUS, y: 0.175 * RADIUS },
    { label: 'team1_tier2_2', x: 0.13 * RADIUS, y: 0.3 * RADIUS },
    { label: 'team1_tier3_2', x: 0 * RADIUS, y: 0.55 * RADIUS },
    { label: 'team1_tier1_3', x: 0.8 * RADIUS, y: 0.2 * RADIUS },
    { label: 'team1_tier2_3', x: 0.575 * RADIUS, y: 0.45 * RADIUS },
    { label: 'team1_tier3_3', x: 0.2 * RADIUS, y: 0.6 * RADIUS },
  ];

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {error ? (
        <div style={{ color: 'red', textAlign: 'center', padding: '1rem' }}>
          Failed to load minimap data.
        </div>
      ) : (
        <div style={{ position: 'relative', float: 'right', width: `${MINIMAP_SIZE}px`, height: `${MINIMAP_SIZE}px` }}>
          <img
            ref={mapRef}
            src={images.minimap}
            alt="Minimap"
            style={{ width: '100%', height: 'auto' }}
            onError={() => {
              console.error('Image failed to load');
              setError(true);
            }}
          />

          {images.minimap && objectiveCoordinates.map(({ label, x, y }) => {
            const left = ((x / DIAMETER) + 0.5) * MINIMAP_SIZE;
            const top = ((-y / DIAMETER) + 0.5) * MINIMAP_SIZE;
            return (
              <div
                key={label}
                aria-label={label}
                style={{
                  position: 'absolute',
                  left: `${left}px`,
                  top: `${top}px`,
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: 'red',
                    borderRadius: '50%',
                    margin: '0 auto'
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Minimap;
