import React, { useState, useMemo } from 'react';
import { ParsedPlayer, PlayerMatchData } from '../../domain/player';
import { BossSnapshot } from '../../domain/boss';
import { TimeRange } from '../../domain/timeline';
import TeamSelector, { Team } from '../matchAnalysis/TeamSelector';
import TimeRangeSelector from '../matchAnalysis/TimeRangeSelector';
import SankeyDiagram, { SankeyNode, SankeyLink } from '../matchAnalysis/SankeyDiagram';
import { getTimeRangeTicks } from '../../services/timeline';
import { aggregateObjectiveDamage } from '../../services/damage';

interface ObjectiveDamageContributionProps {
  players: ParsedPlayer[];
  perPlayerData: Record<string, PlayerMatchData>;
  bossSnapshots: BossSnapshot[];
  totalMatchTime: number;
}

const ObjectiveDamageContribution: React.FC<ObjectiveDamageContributionProps> = ({
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
    return aggregateObjectiveDamage(
      selectedTeam,
      players,
      perPlayerData,
      bossSnapshots,
      startTick,
      endTick
    );
  }, [selectedTeam, players, perPlayerData, bossSnapshots, totalMatchTime, selectedTimeRange]);

  // Transform data for ECharts Sankey
  const sankeyData = useMemo(() => {
    if (damageData.playerContributions.length === 0 || damageData.objectiveTargets.length === 0) {
      return { nodes: [], links: [] };
    }

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Create a map for player names with hero
    const playerNameMap = new Map<string, string>();
    damageData.playerContributions.forEach((player) => {
      playerNameMap.set(player.playerId, `${player.playerName} (${player.heroName})`);
    });

    // Create player source nodes
    damageData.playerContributions.forEach((player) => {
      nodes.push({
        name: `${player.playerName} (${player.heroName})`,
        totalDamage: player.damage,
        itemStyle: { color: teamColor },
      });
    });

    // Create objective target nodes
    damageData.objectiveTargets.forEach((objective) => {
      const objectiveColor = '#8B4513'; // Brown for all objectives
      nodes.push({
        name: objective.name,
        totalDamage: objective.damage,
        itemStyle: { color: objectiveColor },
      });
    });

    // Create links using the player-objective damage matrix
    damageData.playerObjectiveDamageMatrix.forEach((entry) => {
      const playerFullName = playerNameMap.get(entry.playerId);
      if (playerFullName && entry.damage > 0) {
        links.push({
          source: playerFullName,
          target: entry.objectiveName,
          value: entry.damage,
          percentage: (entry.damage / damageData.totalObjectiveDamage) * 100,
        });
      }
    });

    return { nodes, links };
  }, [teamColor, damageData]);

  const primaryContributor = damageData.playerContributions[0] || null;

  // Create timing markers
  const timingMarkers = useMemo(() => {
    return damageData.objectiveTargets
      .filter((obj) => obj.deathTime !== null)
      .map((obj) => ({
        name: obj.name,
        destroyedAt: obj.deathTime!,
      }))
      .sort((a, b) => a.destroyedAt - b.destroyedAt);
  }, [damageData.objectiveTargets]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-0 mb-6 mx-8">
      <h2 className="text-2xl font-bold mb-4">Objective Damage Contribution</h2>

      <div className="flex gap-4 mb-6 flex-wrap">
        <TeamSelector selectedTeam={selectedTeam} onTeamChange={setSelectedTeam} />
        <TimeRangeSelector
          selectedRange={selectedTimeRange}
          onRangeChange={setSelectedTimeRange}
        />
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded">
        <div className="flex gap-6 flex-wrap">
          <div>
            <span className="text-sm text-gray-600">Total Objective Damage:</span>
            <span className="ml-2 text-lg font-bold">
              {damageData.totalObjectiveDamage.toLocaleString()}
            </span>
          </div>
          {primaryContributor && (
            <div>
              <span className="text-sm text-gray-600">Primary Contributor:</span>
              <span className="ml-2 text-lg font-bold">
                {primaryContributor.playerName} ({primaryContributor.heroName}) -{' '}
                {primaryContributor.damage.toLocaleString()} (
                {primaryContributor.percentage.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {timingMarkers.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Objective Timing:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {timingMarkers.map((marker, index) => (
              <div key={index} className="text-sm">
                <span className="text-gray-600">{marker.name}:</span>
                <span className="ml-1 font-medium">
                  {Math.floor(marker.destroyedAt / 60)}:
                  {String(marker.destroyedAt % 60).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sankeyData.nodes.length > 0 ? (
        <SankeyDiagram nodes={sankeyData.nodes} links={sankeyData.links} />
      ) : (
        <p className="text-center text-gray-500 py-8">
          No objective damage data available for selected time range
        </p>
      )}
    </div>
  );
};

export default ObjectiveDamageContribution;
