import { useRef, useState, useEffect, Dispatch, SetStateAction } from "react";
import Grid from "./Grid";
import Objectives from "./Objectives";
import RegionToggle from "./RegionToggle";
import RegionsMapping from "./RegionsMapping";
import PlayerPositions from "./PlayerPositions";
import { Region } from "../../types/Region";
import { ScaledPlayerCoord, PlayerData } from "../../types/Player";
import { ScaledBossSnapshot } from "../../types/Boss";
import { DestroyedObjective } from "../../types/DestroyedObjective";

const MINIMAP_URL =
  "https://assets-bucket.deadlock-api.com/assets-api-res/images/maps/minimap.png";

const Minimap = ({
  currentTick,
  setCurrentTick,
  total_match_time_s,
  scaledBossSnapshots,
  MINIMAP_SIZE,
  destroyedObjectivesSorted,
  setCurrentObjectiveIndex,
  regions,
  scaledPlayerCoords,
  players,
  startRepeat,
  stopRepeat,
}: {
  currentTick: number;
  setCurrentTick: Dispatch<SetStateAction<number>>;
  total_match_time_s: number;
  match_start_time_s: number;
  scaledBossSnapshots: ScaledBossSnapshot[];
  MINIMAP_SIZE: number;
  destroyedObjectivesSorted: Array<DestroyedObjective>;
  setCurrentObjectiveIndex: Dispatch<SetStateAction<number>>;
  regions: Region[];
  scaledPlayerCoords: ScaledPlayerCoord[];
  players: PlayerData[];
  startRepeat: (direction: "back" | "forward") => void;
  stopRepeat: () => void;
}) => {
  const mapRef = useRef<HTMLImageElement>(null);
  const [activeObjectiveKey, setActiveObjectiveKey] = useState<string | null>(
    null
  );
  const [visibleRegions, setVisibleRegions] = useState<{
    [label: string]: boolean;
  }>(() => Object.fromEntries(regions.map((r) => [r.label, true])));
  const visibleRegionList = regions.filter((r) => visibleRegions[r.label]);

  const handleRegionToggle = (label: string) => {
    setVisibleRegions((v) => ({ ...v, [label]: !v[label] }));
  };

  useEffect(() => {
    let lastActiveKey: string | null = null;
    let currentIdx = -1;
    destroyedObjectivesSorted.forEach((obj, idx) => {
      if (currentTick >= obj.destroyed_time_s) {
        lastActiveKey = `${obj.team}_${obj.team_objective_id}`;
        currentIdx = idx;
      }
    });
    setActiveObjectiveKey(lastActiveKey);
    setCurrentObjectiveIndex(currentIdx);
  }, [destroyedObjectivesSorted, currentTick]);

  return (
    <>
      {/* Minimap and slider */}
      <div
        title='MinimapPanel'
        className='h-fit shadow shadow-black/50'
      >
        <div
          className={`pointer-events-none relative`}
          style={{ width: `${MINIMAP_SIZE}px`, height: `${MINIMAP_SIZE}px` }}
        >
          {/* <Grid MINIMAP_SIZE={MINIMAP_SIZE} /> */}
          <RegionsMapping
            MINIMAP_SIZE={MINIMAP_SIZE}
            regions={visibleRegionList}
          />
          <img
            ref={mapRef}
            src={MINIMAP_URL}
            alt='Minimap'
            className='pointer-events-none z-0 h-full w-full object-cover'
          />
          <Objectives
            scaledBossSnapshots={scaledBossSnapshots}
            destroyedObjectives={destroyedObjectivesSorted}
            currentTick={currentTick}
            activeObjectiveKey={activeObjectiveKey}
          />
          <PlayerPositions
            scaledPlayerCoords={scaledPlayerCoords}
            players={players}
          />
        </div>
        <div className='border-top padding-0 flex w-full flex-col items-stretch gap-0 border-black/50 bg-gray-300'>
          <RegionToggle
            regions={regions}
            visibleRegions={visibleRegions}
            onToggle={handleRegionToggle}
          />
        </div>
      </div>
    </>
  );
};

export default Minimap;
