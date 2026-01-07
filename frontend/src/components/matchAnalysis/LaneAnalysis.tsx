import React, { useState } from 'react';
import { NPCDamageStats } from '../../types/LaneAnalysis';
import { ParsedPlayer, PlayerMatchData } from "../../types/Player";
import LaneSelector from './LaneSelector';
import SankeyDiagram from './SankeyDiagram';

interface LaneAnalysisProps {
  players: ParsedPlayer[];
  perPlayerData: Record<string, PlayerMatchData>;
  currentTick: number;
  totalMatchTime: number;
}

const LaneAnalysis: React.FC<LaneAnalysisProps> = ({
  players,
  perPlayerData,
  totalMatchTime,
}) => {
  const [selectedLane, setSelectedLane] = useState<number | null>(null);

  // Calculate laning phase end (33% of total match time)
  const laningPhaseEndTick = Math.floor(totalMatchTime * 0.33);

  // Calculate NPC damage stats for selected lane during laning phase
  const npcStats = React.useMemo(() => {
    if (!selectedLane) return [];

    const lanePlayers = players.filter(p => p.lane === selectedLane);
    const stats: NPCDamageStats[] = [];

    lanePlayers.forEach((player) => {
      const playerMatchData = perPlayerData[player.custom_id];
      if (!playerMatchData || !playerMatchData.damage) return;

      const playerStats: NPCDamageStats = {
        playerId: player.custom_id,
        playerName: player.name,
        team: player.team,
        heroName: player.hero.name,
        laneCreeps: 0,
        neutrals: 0,
        guardian: 0,
      };

      // Aggregate damage during laning phase (0 to laningPhaseEndTick)
      for (let tick = 0; tick <= laningPhaseEndTick && tick < playerMatchData.damage.length; tick++) {
        const tickDamage = playerMatchData.damage[tick];
        if (!tickDamage) continue;

        Object.entries(tickDamage).forEach(([victimId, damageRecords]) => {
          const totalDamage = damageRecords.reduce((sum, record) => sum + (record.damage || 0), 0);
          if (totalDamage <= 0) return;

          // NPC damage (20 = lane creeps, 22 = neutrals, 21 = guardian)
          if (victimId === '20') {
            playerStats.laneCreeps += totalDamage;
          } else if (victimId === '22') {
            playerStats.neutrals += totalDamage;
          } else if (victimId === '21') {
            playerStats.guardian += totalDamage;
          }
        });
      }

      stats.push(playerStats);
    });

    return stats.sort((a, b) => a.team - b.team);
  }, [selectedLane, players, perPlayerData, laningPhaseEndTick]);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <h3 className="text-center font-semibold text-gray-700 text-lg">
        Lane {selectedLane} Hero Damage Trades - Laning Phase (0:00 - {Math.floor(laningPhaseEndTick / 60)}:{String(laningPhaseEndTick % 60).padStart(2, '0')})
      </h3>
      {/* Lane Selector */}
      <LaneSelector selectedLane={selectedLane} onLaneChange={setSelectedLane} />

      <div className="flex gap-4 mb-6">
        {/* Only show analysis when a lane is selected */}
        {selectedLane && (
          <>
            {/* Sankey Diagram for Player-to-Player Trades */}
            <SankeyDiagram
              selectedLane={selectedLane}
              players={players}
              perPlayerData={perPlayerData}
              laningPhaseEndTick={laningPhaseEndTick}
            />

            {/* NPC Damage Stats Table */}
            <div className="w-2/5 max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left">Hero</th>
                      <th className="px-4 py-2 text-right">Lane Creeps</th>
                      <th className="px-4 py-2 text-right">Neutrals</th>
                      <th className="px-4 py-2 text-right">Guardian</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {npcStats.map((stat) => {
                      const total = stat.laneCreeps + stat.neutrals + stat.guardian;
                      const teamColor = stat.team === 2 ? '#FF8C00' : '#4169E1';
                      return (
                        <tr key={stat.playerId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: teamColor }}
                            />
                            {stat.heroName}
                          </td>
                          <td className="px-4 py-2 text-right">{stat.laneCreeps.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">{stat.neutrals.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">{stat.guardian.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right font-semibold">{total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LaneAnalysis;
