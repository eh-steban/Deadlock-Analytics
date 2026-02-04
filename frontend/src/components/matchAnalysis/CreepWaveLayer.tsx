import { CreepWaveData } from "../../domain/creep";
import { LanePressureData } from "../../domain/lanePressure";
import CreepWaveIndicator from "./CreepWaveIndicator";

interface CreepWaveLayerProps {
  creepWaves: CreepWaveData;
  lanePressure: LanePressureData;
  currentTick: number;
  worldToMinimapPixels: (x: number, y: number) => { left: number; top: number };
}

const CreepWaveLayer = ({
  creepWaves,
  lanePressure,
  currentTick,
  worldToMinimapPixels,
}: CreepWaveLayerProps) => {
  const indicators: React.ReactElement[] = [];

  // Iterate through all lane/team combinations
  for (const [laneTeamKey, waveSnapshots] of Object.entries(
    creepWaves.waves
  )) {
    // Get wave snapshot for current tick
    const waveSnapshot =
      currentTick < waveSnapshots.length ? waveSnapshots[currentTick] : null;

    if (!waveSnapshot) {
      continue; // No wave data for this tick
    }

    // Get corresponding pressure snapshot
    const pressureSnapshots = lanePressure.pressure[laneTeamKey];
    const pressureSnapshot =
      pressureSnapshots && currentTick < pressureSnapshots.length
        ? pressureSnapshots[currentTick]
        : null;

    // Transform world coordinates to minimap pixels
    const { left, top } = worldToMinimapPixels(waveSnapshot.x, waveSnapshot.y);

    indicators.push(
      <CreepWaveIndicator
        key={laneTeamKey}
        left={left}
        top={top}
        team={waveSnapshot.team}
        count={waveSnapshot.count}
        pressure={pressureSnapshot ?? undefined}
      />
    );
  }

  return <>{indicators}</>;
};

export default CreepWaveLayer;
