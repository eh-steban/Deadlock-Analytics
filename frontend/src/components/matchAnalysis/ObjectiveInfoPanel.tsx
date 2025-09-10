import React from "react";
import { DestroyedObjective } from "../../types/DestroyedObjective";
import { formatSecondstoMMSS } from "../../utils/time";

interface ObjectiveInfoPanelProps {
  destroyedObjectives: DestroyedObjective[];
  currentObjectiveIndex: number;
}

const ObjectiveInfoPanel: React.FC<ObjectiveInfoPanelProps> = ({
  destroyedObjectives,
  currentObjectiveIndex,
}) => (
  <>
    {destroyedObjectives.length > 0 && <h3>Objective Info</h3>}
    <div
      style={{
        maxHeight: "calc(100vh - 220px)",
        overflowY: "auto",
        background: "none",
        border: "none",
        borderRadius: 0,
        padding: 0,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.5rem 1%",
        width: "100%",
      }}
    >
      {destroyedObjectives
        .filter((_, index) => index <= currentObjectiveIndex)
        .map((obj, idx) => (
          <div
            key={idx}
            style={{
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "0.5rem 0.75rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              marginBottom: 0,
            }}
          >
            <div
              style={{ fontWeight: 600, fontSize: "1.05em", marginBottom: 2 }}
            >
              Objective{" "}
              <span
                style={{ color: "#888", fontWeight: 400, fontSize: "0.95em" }}
              >
                (Team {obj.team}, ID {obj.team_objective_id})
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                fontSize: "0.97em",
              }}
            >
              <div>
                <strong>Destroyed Time:</strong>{" "}
                {formatSecondstoMMSS(obj.destroyed_time_s)}
              </div>
              <div>
                <strong>Creep Damage:</strong> {obj.creep_damage}
              </div>
              <div>
                <strong>Creep Damage Mitigated:</strong>{" "}
                {obj.creep_damage_mitigated}
              </div>
              <div>
                <strong>Player Damage:</strong> {obj.player_damage}
              </div>
              <div>
                <strong>Player Damage Mitigated:</strong>{" "}
                {obj.player_damage_mitigated}
              </div>
              <div>
                <strong>First Damage Time (s):</strong>{" "}
                {formatSecondstoMMSS(obj.first_damage_time_s)}
              </div>
            </div>
          </div>
        ))}
    </div>
    <hr
      style={{
        margin: "1.2rem 0 0.7rem 0",
        border: 0,
        borderTop: "1.5px solid #bbb",
        width: "100%",
      }}
    />
  </>
);

export default ObjectiveInfoPanel;
