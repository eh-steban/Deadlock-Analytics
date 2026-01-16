import React, { useState, useMemo } from 'react';
import { ParsedPlayer, PlayerMatchData } from '../../domain/player';
import { BossSnapshot } from '../../domain/boss';
import { TimeRange } from '../../domain/timeline';
import TeamSelector, { Team } from '../matchAnalysis/TeamSelector';
import TimeRangeSelector from '../matchAnalysis/TimeRangeSelector';
import SankeyDiagram, { SankeyNode, SankeyLink } from '../matchAnalysis/SankeyDiagram';
import { getTimeRangeTicks } from '../../services/timeline';
import { aggregateTeamDamage } from '../../services/damage';

interface TeamDamageAllocationProps {
  players: ParsedPlayer[];
  perPlayerData: Record<string, PlayerMatchData>;
  bossSnapshots: BossSnapshot[];
  totalMatchTime: number;
}

const TeamDamageAllocation: React.FC<TeamDamageAllocationProps> = ({
  players,
  perPlayerData,
  bossSnapshots,
  totalMatchTime,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team>(2); // Default to Amber
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('full');
  const teamName = selectedTeam === 2 ? 'Amber' : 'Sapphire';
  const teamColor = selectedTeam === 2 ? '#FF8C00' : '#4169E1';

  const damageData = useMemo(() => {
    const [startTick, endTick] = getTimeRangeTicks(totalMatchTime, selectedTimeRange);
    return aggregateTeamDamage(
      selectedTeam,
      players,
      perPlayerData,
      bossSnapshots,
      startTick,
      endTick
    );
  }, [selectedTeam, players, perPlayerData, bossSnapshots, totalMatchTime, selectedTimeRange]);

  // Transform data for ECharts Sankey (exclude lane creeps from diagram)
  const sankeyData = useMemo(() => {
    // Filter out lane_creeps from diagram
    const targetsForDiagram = damageData.targets.filter(
      (target) => target.type !== 'lane_creeps'
    );

    if (targetsForDiagram.length === 0) {
      return { nodes: [], links: [] };
    }

    const sourceNodeName = `${teamName} Team`;

    // Create source node (team aggregate)
    const nodes: SankeyNode[] = [
      {
        name: sourceNodeName,
        itemStyle: { color: teamColor },
      },
    ];

    // Create target nodes and links
    const links: SankeyLink[] = [];

    targetsForDiagram.forEach((target) => {
      let targetColor = '#888888';
      if (target.type === 'player') {
        targetColor = target.team === 2 ? '#FF8C00' : '#4169E1';
      } else if (target.type === 'boss') {
        targetColor = '#8B4513';
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
  }, [teamName, teamColor, damageData]);

  const mostFocusedTarget = damageData.targets.find(
    (target) => target.type !== 'lane_creeps'
  ) || null;

  const laneCreepsTarget = damageData.targets.find(
    (target) => target.type === 'lane_creeps'
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-6 mx-8">
      <h2 className="text-2xl font-bold mb-4">Team Damage Allocation</h2>

      <div className="flex gap-4 mb-6 flex-wrap">
        <TeamSelector selectedTeam={selectedTeam} onTeamChange={setSelectedTeam} />
        <TimeRangeSelector
          selectedRange={selectedTimeRange}
          onRangeChange={setSelectedTimeRange}
        />
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded">
        <div className="flex gap-6">
          <div>
            <span className="text-sm text-gray-600">Total Team Damage:</span>
            <span className="ml-2 text-lg font-bold">
              {damageData.totalDamage.toLocaleString()}
            </span>
          </div>
          {mostFocusedTarget && (
            <div>
              <span className="text-sm text-gray-600">Most Focused Target:</span>
              <span className="ml-2 text-lg font-bold">
                {mostFocusedTarget.name} (
                {mostFocusedTarget.damage.toLocaleString()},{' '}
                {mostFocusedTarget.percentage?.toFixed(1)}%)
              </span>
            </div>
          )}
          {laneCreepsTarget && (
            <div>
              <span className="text-sm text-gray-600">Lane Creeps Damage:</span>
              <span className="ml-2 text-lg font-bold">
                {laneCreepsTarget.damage.toLocaleString()} (
                {laneCreepsTarget.percentage?.toFixed(1)}%)
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
    </div>
  );
};

export default TeamDamageAllocation;
