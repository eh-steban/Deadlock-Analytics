import React from "react";
import { ParsedGameData } from "../../types/MatchAnalysis";
import {
  NPC,
  PlayerData,
  PlayerGameData,
  PlayerPosition,
} from "../../types/Player";

interface PlayerCardsProps {
  playersData: PlayerData[];
  per_player_data: Record<string, PlayerGameData>;
  // npcs: Record<string, NPC>;
  // positions: PlayerPosition[][];
  currentTick: number;
  gameData: ParsedGameData;
  // getPlayerRegionLabels: (
  //   x_max: number,
  //   x_min: number,
  //   y_max: number,
  //   y_min: number,
  //   playerX: number,
  //   playerY: number
  // ) => string[];
}

enum MoveType {
  Normal = 0,
  Ability = 1,
  AbilityDebuff = 2,
  GroundDash = 3,
  Slide = 4,
  RopeClimbing = 5,
  Ziplining = 6,
  InAir = 7,
  AirDash = 8,
}

// TODO: Add typechecking?
const PlayerCards: React.FC<PlayerCardsProps> = ({
  playersData,
  per_player_data,
  // npcs,
  // positions,
  currentTick,
  gameData,
  // getPlayerRegionLabels,
}) => {
  return (
    <>
      <h3 style={{ margin: "0 0 0.5rem 0" }}>Player Info</h3>
      <div
        title='playerCards'
        style={{
          overflowY: "auto",
          background: "none",
          border: "none",
          borderRadius: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          width: "100%",
          gap: "0.25rem",
        }}
      >
        {playersData.map((player) => {
          // const playerInfo = player.player_info;
          // const playerPathState = player.path_state;
          const player_id = player.custom_id;
          const team = player.team;
          const hero = player.hero;
          const heroName = hero ? hero.name : `Hero ${player.hero_id}`;
          const heroImg =
            hero && hero.images && hero.images.icon_hero_card_webp;
          const health = 0;
          const moveType = "Moving";
          const combatType = "Pew pew";
          // const health = playerPathState.health[currentTick];
          // const moveType = playerPathState.move_type[currentTick];
          // const moveTypeLabel =
          //   moveType !== undefined && MoveType[moveType] !== undefined ?
          //     MoveType[moveType]
          //   : moveType;
          // const combatTypes =
          //   playerPathState.combat_type.slice(currentTick, currentTick + 1) ||
          //   [];
          // const combatTypeSet = Array.from(
          //   new Set(combatTypes.filter((x) => x !== undefined))
          // );
          // const combatTypeLabels = [
          //   "Out of Combat",
          //   "Player",
          //   "Enemy NPC",
          //   "Neutral",
          // ];
          // const combatTypeLabelList = combatTypeSet
          //   .map((type) => combatTypeLabels[type] || type)
          //   .join(", ");
          // const regionLabels: string[] = getPlayerRegionLabels(
          //   playerPathState.x_max,
          //   playerPathState.x_min,
          //   playerPathState.y_max,
          //   playerPathState.y_min,
          //   playerPathState.x_pos[currentTick],
          //   playerPathState.y_pos[currentTick]
          // );

          // const damageWindow = gameData.damage[currentTick] || {};

          // If found, get the victim map for this attacker
          // const attackerVictimMap = damageWindow[index];

          return (
            <div
              key={`player-card-${player.lobby_player_slot}`}
              style={{
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
                boxShadow: "0 0.0625rem 0.125rem rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                gap: "0.025rem",
              }}
            >
              {heroImg && (
                <img
                  src={heroImg}
                  alt={heroName}
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "1rem",
                    objectFit: "cover",
                    background: "#eee",
                    border: "1px solid #ddd",
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.125rem",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "1.05em",
                    marginBottom: "0.125rem",
                  }}
                >
                  {heroName}{" "}
                  <span
                    style={{
                      color: "#888",
                      fontWeight: 400,
                      fontSize: "0.95em",
                    }}
                  >
                    (Name: {player.name}, Slot: {player.lobby_player_slot},
                    Team: {team})
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    fontSize: "0.97em",
                  }}
                >
                  <div>
                    <strong>Health:</strong>{" "}
                    {health !== undefined ? health : "-"}
                  </div>
                  <div>
                    <strong>Move Type:</strong>{" "}
                    {moveType !== undefined ? moveType : "-"}
                  </div>
                  <div>
                    <strong>Combat Type:</strong>{" "}
                    {combatType !== undefined ? combatType : "-"}
                  </div>
                  <div>
                    <strong>Position:</strong>{" "}
                    {per_player_data[player_id].positions[currentTick] ?
                      `X: ${per_player_data[player_id].positions[currentTick].x.toFixed(2)}, Y: ${per_player_data[player_id].positions[currentTick].y.toFixed(2)}, Z: ${per_player_data[player_id].positions[currentTick].z.toFixed(2)}`
                    : "-"}
                  </div>
                  {/* <div>
                    <strong>Current Region:</strong> {regionLabels.join(", ")}
                  </div> */}
                  <div>
                    <strong>Victims:</strong>
                    {(
                      per_player_data[player_id].damage &&
                      Object.entries(per_player_data[player_id].damage).length >
                        0
                    ) ?
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {Object.entries(
                          per_player_data[player_id].damage[currentTick]
                        ).map(([victimIdx, damageRecords]) => {
                          const victimPlayer = playersData[Number(victimIdx)];
                          // const victimNPC = npcs[Number(victimIdx)];
                          // console.log("victimNPC: ", victimNPC);
                          console.log("victimIDX: ", victimIdx);
                          let victimName =
                            victimPlayer ?
                              victimPlayer.name
                              // : victimNPC ? victimNPC.name
                            : `Victim ${victimIdx}`;
                          return (
                            <li key={victimIdx}>
                              {victimName}
                              <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {damageRecords.map((rec, idx) => (
                                  <li key={idx}>
                                    Damage: {rec.damage} | Type: {rec.type} |
                                    ability_id: {rec.ability_id} |
                                    attacker_class: {rec.attacker_class} |
                                    citadel_type: {rec.citadel_type} |
                                    victim_class: {rec.victim_class}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          );
                        })}
                      </ul>
                    : "-"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PlayerCards;
