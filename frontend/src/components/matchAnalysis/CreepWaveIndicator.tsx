import { LanePressureSnapshot } from "../../domain/lanePressure";

interface CreepWaveIndicatorProps {
  left: number;
  top: number;
  team: number;
  count: number;
  pressure?: LanePressureSnapshot;
}

const CreepWaveIndicator = ({
  left,
  top,
  team,
  count,
  pressure,
}: CreepWaveIndicatorProps) => {
  // Team colors (Amber = team 2, Sapphire = team 3)
  const teamColor = team === 2 ? "#FFA500" : "#0EA5E9"; // Amber orange, Sapphire blue
  const teamName = team === 2 ? "Amber" : "Sapphire";

  // Triangle size (fixed for now)
  const size = 20;

  // Build tooltip text
  const tooltipLines = [
    `Team: ${teamName}`,
    `Creeps: ${count}`,
  ];

  if (pressure) {
    tooltipLines.push(`Pressure: ${(pressure.pressure * 100).toFixed(0)}%`);
    if (pressure.attributed_players.length > 0) {
      tooltipLines.push(
        `Players: ${pressure.attributed_players.join(", ")}`
      );
    }
  }

  const tooltipText = tooltipLines.join("\n");

  return (
    <div
      className="pointer-events-auto absolute z-20"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: "translate(-50%, -50%)",
      }}
      title={tooltipText}
    >
      {/* Triangle pointing up (using CSS border trick) */}
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} viewBox="0 0 20 20">
          <polygon
            points="10,2 2,18 18,18"
            fill={teamColor}
            stroke="black"
            strokeWidth="1"
          />
        </svg>
        {/* Creep count overlay */}
        <div
          className="absolute text-xs font-bold text-white"
          style={{
            textShadow: "0 0 2px black, 0 0 2px black",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -25%)",
          }}
        >
          {count}
        </div>
      </div>
    </div>
  );
};

export default CreepWaveIndicator;
