import React from 'react';
import { DestroyedObjective } from '../types/DestroyedObjective';

interface ObjectiveCoordinate {
  label: string;
  x: number;
  y: number;
  team_id?: number;
  team_objective_id?: number;
}

interface ObjectivesProps {
  objectiveCoordinates: ObjectiveCoordinate[];
  destroyedObjectives: DestroyedObjective[];
  currentTime: number;
  renderObjectiveDot: (obj: ObjectiveCoordinate) => { left: number; top: number };
  activeObjectiveKey?: string | null;
}

const Objectives: React.FC<ObjectivesProps> = ({
  objectiveCoordinates,
  destroyedObjectives,
  currentTime,
  renderObjectiveDot,
  activeObjectiveKey,
}) => {
  return (
    <>
      {objectiveCoordinates.map(({ team_id, team_objective_id, label, x, y }) => {
        const { left, top } = renderObjectiveDot({ label, x, y, team_id, team_objective_id });
        const match = destroyedObjectives.find(obj => Number(obj.team) === team_id && Number(obj.team_objective_id) === team_objective_id);
        const isDestroyed = match ? currentTime >= match.destroyed_time_s : false;
        const isActive = activeObjectiveKey === `${team_id}_${team_objective_id}`;
        const color = isDestroyed ? 'black' : 'red';

        return (
          <div
            key={`${team_id}_${team_objective_id}`}
            title={`${team_id}_${team_objective_id}`}
            style={{
              position: 'absolute',
              left,
              top,
              width: 10,
              height: 10,
              backgroundColor: color,
              borderRadius: '50%',
              border: isActive ? '2px solid yellow' : '1px solid red',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
            }}
          />
        );
      })}
    </>
  );
};

export default Objectives;
