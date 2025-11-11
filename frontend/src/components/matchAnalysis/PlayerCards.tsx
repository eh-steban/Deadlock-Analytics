import React from "react";
import { ParsedGameData } from "../../types/MatchAnalysis";
import { Region } from "../../types/Region";
import { regions } from "../../data/regions";
import {
  PlayerData,
  PlayerGameData,
  DRTypeAggregateBySec,
} from "../../types/Player";
import pointInPolygon from "point-in-polygon";

interface PlayerCardsProps {
  playersData: PlayerData[];
  per_player_data: Record<string, PlayerGameData>;
  currentTick: number;
  gameData: ParsedGameData;
  normalizePosition: (x: number, y: number) => { normX: number; normY: number };
}

function getPlayerRegionLabels(x: number, y: number): string[] {
  const foundRegions: string[] = regions
    .filter((region: Region) => pointInPolygon([x, y], region.polygon))
    .map<string>((region): string => {
      return region.label ? region.label : "None";
    });
  return foundRegions;
}

// TODO: Add typechecking?
const PlayerCards: React.FC<PlayerCardsProps> = ({
  playersData,
  per_player_data,
  currentTick,
  normalizePosition,
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
          const customId = Number(player.custom_id);
          const pdata = per_player_data[customId];
          const playerPosition = pdata.positions[currentTick];
          const victimDamageMap = pdata.damage[currentTick];
          const team = player.team;
          const hero = player.hero;
          const heroName = hero ? hero.name : `Hero ${player.hero_id}`;
          const heroImg =
            hero && hero.images && hero.images.icon_hero_card_webp;
          const health = 0;
          // const health = playerPathState.health[currentTick];
          const { normX, normY } = normalizePosition(
            playerPosition.x,
            playerPosition.y
          );
          const regionLabels: string[] = getPlayerRegionLabels(normX, normY);

          // Summarize: victimId -> (type -> totalDamage)
          // FIXME: Just for display purposes, but this should be done
          // in our backend or data processing steps ideally
          const totalsByVictim: Record<
            string,
            Record<number, DRTypeAggregateBySec>
          > = {};
          for (const [victimId, records] of Object.entries(victimDamageMap)) {
            const aggByType: Record<number, DRTypeAggregateBySec> = {};
            for (const rec of records) {
              const t = rec.type ?? -1;
              // FIXME: Not all the fields below are being displayed/used.
              // Need to update this to show this data somewhere.
              const entry = (aggByType[t] ??= {
                type: t,
                agg_damage: 0,
                agg_pre_damage: 0,
                citadel_type: rec.citadel_type ?? 0,
                entindex_inflictor: rec.entindex_inflictor ?? 0,
                entindex_ability: rec.entindex_ability ?? 0,
                agg_damage_absorbed: 0,
                victim_health_max: 0,
                victim_health_new: 0,
                flags: rec.flags ?? 0,
                ability_id: rec.ability_id ?? 0,
                attacker_class: rec.attacker_class ?? 0,
                victim_class: rec.victim_class ?? 0,
                victim_shield_max: 0,
                agg_victim_shield_new: 0,
                agg_hits: 0,
                agg_health_lost: 0,
              });
              entry.agg_damage += rec.damage ?? 0;
              entry.agg_pre_damage += rec.pre_damage ?? 0;
              entry.agg_damage_absorbed += rec.damage_absorbed ?? 0;
              entry.agg_victim_shield_new += rec.victim_shield_new ?? 0;
              entry.agg_hits += rec.hits ?? 0;
              entry.agg_health_lost += rec.health_lost ?? 0;
            }
            totalsByVictim[victimId] = aggByType;
          }

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
                    <strong>Current Region:</strong> {regionLabels.join(", ")}
                  </div>
                  <div>
                    {Object.keys(victimDamageMap).length === 0 ?
                      <strong>Out of combat</strong>
                    : <>
                        <strong>Victims:</strong>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {Object.entries(totalsByVictim).map(
                            ([victimId, typeTotals]) => {
                              const victimPlayer = playersData.find(
                                (p) => String(p.custom_id) === victimId
                              );
                              const victimName =
                                victimPlayer ?
                                  victimPlayer.name
                                : `Victim ${victimId}`;
                              return (
                                <li key={victimId}>
                                  {victimName}
                                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                                    {Object.entries(typeTotals).map(
                                      ([type, DRAgg]) => (
                                        <li key={type}>
                                          Type {type}: {DRAgg.agg_damage}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </li>
                              );
                            }
                          )}
                        </ul>
                        {/*
                          FIXME: The below block is being kept for debugging in dev.
                          This should be removed later.
                        */}
                        {/* <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {Object.entries(victimDamageMap).map(
                            ([victimIdx, damageRecords]) => {
                              const victimPlayer =
                                playersData[Number(victimIdx)];
                              let victimName =
                                victimPlayer ?
                                  victimPlayer.name
                                : `Victim ${victimIdx}`;
                              return (
                                <li key={victimIdx}>
                                  {victimName}
                                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                                    {damageRecords.map((rec, idx) => (
                                      <li key={idx}>
                                        Damage: {rec.damage} | Type: {rec.type}{" "}
                                        | ability_id: {rec.ability_id} |
                                        attacker_class: {rec.attacker_class} |
                                        citadel_type: {rec.citadel_type} |
                                        victim_class: {rec.victim_class}
                                      </li>
                                    ))}
                                  </ul>
                                </li>
                              );
                            }
                          )}
                        </ul> */}
                      </>
                    }
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
