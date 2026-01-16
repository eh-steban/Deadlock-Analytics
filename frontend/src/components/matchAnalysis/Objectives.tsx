import React from "react";
import { ScaledBossSnapshot } from "../../types/Boss";
import { DestroyedObjective } from "../../types/DestroyedObjective";

interface ObjectivesProps {
  scaledBossSnapshots: ScaledBossSnapshot[];
  destroyedObjectives: DestroyedObjective[];
  currentTick: number;
  activeObjectiveKey?: string | null;
}

const Objectives: React.FC<ObjectivesProps> = ({
  scaledBossSnapshots,
  destroyedObjectives,
  currentTick,
  activeObjectiveKey,
}) => {
  return (
    <>
      {scaledBossSnapshots.map(
        ({
          entity_index,
          custom_id,
          boss_name_hash,
          team,
          lane,
          x,
          y,
          z,
          spawn_time_s,
          max_health,
          life_state_on_create,
          death_time_s,
          life_state_on_delete,
          left,
          top,
        }) => {
          // const match = destroyedObjectives.find(
          //   (obj) =>
          //     Number(obj.team) === team_id &&
          //     Number(obj.team_objective_id) === team_objective_id
          // );
          // const isDestroyed =
          //   match ? currentTick >= match.destroyed_time_s : false;
          // const isActive =
          //   activeObjectiveKey === `${team_id}_${team_objective_id}`;
          // const color = isDestroyed ? "black" : "red";

          return (
            <div
              key={`${team}_${lane}_${custom_id}_${entity_index}`}
              className='pointer-events-auto absolute h-2.5 w-2.5 rounded-full'
              style={{
                left,
                top,
                backgroundColor: "red",
              }}
            />
          );
        }
      )}
    </>
  );
};

export default Objectives;
