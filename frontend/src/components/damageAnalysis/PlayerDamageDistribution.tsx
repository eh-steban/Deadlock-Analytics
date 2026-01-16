import React, { useState, useMemo, useEffect } from 'react';
import { ParsedPlayer, PlayerMatchData } from '../../domain/player';
import { BossSnapshot } from '../../domain/boss';
import PlayerSelector from '../matchAnalysis/PlayerSelector';
import TimeRangeSelector, { TimeRange } from '../matchAnalysis/TimeRangeSelector';
import SankeyDiagram, { SankeyNode, SankeyLink } from '../matchAnalysis/SankeyDiagram';
import { getTimeRangeTicks } from '../../utils/timeRanges';
import { aggregatePlayerDamage } from '../../services/damage';

interface PlayerDamageDistributionProps {
  players: ParsedPlayer[];
  perPlayerData: Record<string, PlayerMatchData>;
  bossSnapshots: BossSnapshot[];
  totalMatchTime: number;
}

const PlayerDamageDistribution: React.FC<PlayerDamageDistributionProps> = ({
  players,
  perPlayerData,
  bossSnapshots,
  totalMatchTime,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('full');
  const [startTick, endTick] = getTimeRangeTicks(totalMatchTime, selectedTimeRange);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.custom_id === selectedPlayerId),
    [players, selectedPlayerId]
  );

  // Aggregate damage data
  const damageData = useMemo(() => {
    if (!selectedPlayerId) {
      return { totalDamage: 0, targets: [] };
    }

    return aggregatePlayerDamage(
      selectedPlayerId,
      players,
      perPlayerData,
      bossSnapshots,
      startTick,
      endTick
    );
  }, [selectedPlayerId, selectedTimeRange]);

  const sankeyData = useMemo(() => {
    if (!selectedPlayer || damageData.targets.length === 0) {
      return { nodes: [], links: [] };
    }

    const sourceNodeName = `${selectedPlayer.name}\n(${selectedPlayer.hero.name})`;
    const teamColor = selectedPlayer.team === 2 ? '#FF8C00' : '#4169E1';

    // Create source node
    const nodes: SankeyNode[] = [
      {
        name: sourceNodeName,
        itemStyle: { color: teamColor },
      },
    ];

    // Create target nodes and links
    const links: SankeyLink[] = [];

    damageData.targets.forEach((target) => {
      // Determine target color
      let targetColor = '#888888'; // Default gray
      if (target.type === 'player') {
        targetColor = target.team === 2 ? '#FF8C00' : '#4169E1';
      } else if (target.type === 'boss') {
        targetColor = '#8B4513';
      } else if (target.type === 'lane_creeps') {
        targetColor = '#4CAF50';
      }

      nodes.push({
        name: target.name,
        itemStyle: { color: targetColor },
      });

      links.push({
        source: sourceNodeName,
        target: target.name,
        value: target.damage,
        percentage: target.percentage || 0,
      });
    });

    return { nodes, links };
  }, [selectedPlayer, damageData]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-6 mx-8">
      <h2 className="text-2xl font-bold mb-4">Player Damage Distribution</h2>
      <div className="flex gap-4 mb-6 flex-wrap">
        <PlayerSelector
          players={players}
          selectedPlayerId={selectedPlayerId}
          onPlayerChange={setSelectedPlayerId}
        />
        <TimeRangeSelector
          selectedRange={selectedTimeRange}
          onRangeChange={setSelectedTimeRange}
        />
      </div>

      {!selectedPlayer && (
        <p className="text-center text-gray-500 py-8">
          Please select a player to view their damage distribution
        </p>
      )}

      {selectedPlayer && (
        <>
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <div className="flex gap-6">
              <div>
                <span className="text-sm text-gray-600">Total Damage:</span>
                <span className="ml-2 text-lg font-bold">
                  {damageData.totalDamage.toLocaleString()}
                </span>
              </div>
              {damageData.targets.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Top Target:</span>
                  <span className="ml-2 text-lg font-bold">
                    {damageData.targets[0].name} (
                    {damageData.targets[0].damage.toLocaleString()},{' '}
                    {damageData.targets[0].percentage?.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {sankeyData.nodes.length > 0 ? (
            <SankeyDiagram nodes={sankeyData.nodes} links={sankeyData.links} />
          ) : (
            <p className="text-center text-gray-500 py-8">
              No damage data available for selected time range
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerDamageDistribution;
