import { useRef, useState, useEffect, Dispatch, SetStateAction } from "react";
import Grid from "./Grid";
import Objectives from "./Objectives";
import RegionToggle from "./RegionToggle";
import RegionsMapping from "./RegionsMapping";
import GameTimeViewer from "./GameTimeViewer";
import PerSecondTable from "./PerSecondTable";
import PlayerPositions from "./PlayerPositions";
import DamageEventsTable from "./DamageEventsTable";
import DamageMatrixTable from "./DamageMatrixTable";
import AllPlayerPositions from "./AllPlayerPositions";
import PerPlayerWindowTable from "./PerPlayerWindowTable";
import DamageSourceTypesTable from "./DamageSourceTypesTable";
import { Region } from "../../types/Region";
import { Hero, PlayerPathState, PlayerInfo } from "../../types/Player";
import { ObjectiveCoordinate } from "../../types/ObjectiveCoordinate";
import { DestroyedObjective } from "../../types/DestroyedObjective";
import { objectiveCoordinates } from "../../data/objectiveCoordinates";

const MINIMAP_SIZE = 768;
const MINIMAP_URL =
  "https://assets-bucket.deadlock-api.com/assets-api-res/images/maps/minimap.png";

const Minimap = ({
  currentTime,
  setCurrentTime,
  playerPaths,
  destroyedObjectivesSorted,
  setCurrentObjectiveIndex,
  regions,
  players,
  heroes,
  xResolution,
  yResolution,
}: {
  currentTime: number;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  playerPaths: PlayerPathState[];
  destroyedObjectivesSorted: Array<DestroyedObjective>;
  setCurrentObjectiveIndex: Dispatch<SetStateAction<number>>;
  regions: Region[];
  players: PlayerInfo[];
  heroes: Hero[];
  xResolution: number;
  yResolution: number;
}) => {
  // NOTE: NodeJS Timeout is used here for the repeat functionality, which is not ideal for React.
  // This is just testing out the PoC so it will be replaced with a more React-friendly solution later.
  const repeatRef = useRef<NodeJS.Timeout | null>(null);
  const repeatDirection = useRef<"left" | "right" | null>(null);
  const mapRef = useRef<HTMLImageElement>(null);
  const [activeObjectiveKey, setActiveObjectiveKey] = useState<string | null>(
    null
  );
  const [visibleRegions, setVisibleRegions] = useState<{
    [label: string]: boolean;
  }>(() => Object.fromEntries(regions.map((r) => [r.label, true])));
  const visibleRegionList = regions.filter((r) => visibleRegions[r.label]);

  // TODO: Not a fan of inverting the y-axis here. Can probably find a better place to do it.
  const renderObjectiveDot = (obj: ObjectiveCoordinate) => {
    return scaleToMinimap(obj.x, 1 - obj.y);
  };
  const renderPlayerDot = (x: number, y: number) => {
    return scaleToMinimap(x, y);
  };
  const scaleToMinimap = (
    x: number,
    y: number
  ): { left: number; top: number } => {
    const xOffset = -75;
    const left = x * MINIMAP_SIZE + xOffset; // Apply offset to x-coordinate
    const top = y * MINIMAP_SIZE;
    return { left, top };
  };
  const handleRegionToggle = (label: string) => {
    setVisibleRegions((v) => ({ ...v, [label]: !v[label] }));
  };

  const startRepeat = (direction: "left" | "right") => {
    if (repeatRef.current) return;
    repeatDirection.current = direction;
    repeatRef.current = setInterval(() => {
      setCurrentTime((t) => {
        if (direction === "left") {
          if (t <= 0) return 0;
          return t - 1;
        } else {
          const maxTick =
            playerPaths[0]?.x_pos?.length ? playerPaths[0].x_pos.length - 1 : 0;
          if (t >= maxTick) return maxTick;
          return t + 1;
        }
      });
    }, 80);
  };

  const stopRepeat = () => {
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
      repeatDirection.current = null;
    }
  };

  useEffect(() => {
    let lastActiveKey: string | null = null;
    let currentIdx = -1;
    destroyedObjectivesSorted.forEach((obj, idx) => {
      if (currentTime >= obj.destroyed_time_s) {
        lastActiveKey = `${obj.team}_${obj.team_objective_id}`;
        currentIdx = idx;
      }
    });
    setActiveObjectiveKey(lastActiveKey);
    setCurrentObjectiveIndex(currentIdx);
  }, [destroyedObjectivesSorted, currentTime]);

  return (
    <>
      {/* Minimap and slider */}
      <div
        title='MinimapPanel'
        style={{
          position: "relative",
          // width: `${MINIMAP_SIZE}px`,
          flexShrink: 0,
          background: "#fafbfc",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.07)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${MINIMAP_SIZE}px`,
            height: `${MINIMAP_SIZE}px`,
            pointerEvents: "none",
          }}
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
            style={{
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
          <Objectives
            objectiveCoordinates={objectiveCoordinates}
            destroyedObjectives={destroyedObjectivesSorted}
            currentTime={currentTime}
            renderObjectiveDot={renderObjectiveDot}
            activeObjectiveKey={activeObjectiveKey}
          />
        </div>
        <PlayerPositions
          playerPaths={playerPaths}
          players={players}
          currentTime={currentTime}
          xResolution={xResolution}
          yResolution={yResolution}
          heroes={heroes}
          renderPlayerDot={renderPlayerDot}
        />
        <div
          style={{
            width: "100%",
            background: "#f7f7f7",
            borderTop: "1px solid #ccc",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 0,
            padding: 0,
          }}
        >
          <GameTimeViewer
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            maxTime={
              playerPaths[0]?.x_pos?.length ?
                playerPaths[0].x_pos.length - 1
              : 0
            }
            startRepeat={startRepeat}
            stopRepeat={stopRepeat}
          />
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
