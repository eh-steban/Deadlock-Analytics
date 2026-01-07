import React, { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer, Rectangle, Layer } from 'recharts';
import { SankeyData, SankeyNode, SankeyLink } from '../../types/LaneAnalysis';
import { ParsedPlayer, PlayerMatchData } from "../../types/Player";

interface SankeyDiagramProps {
  selectedLane: number;
  players: ParsedPlayer[];
  perPlayerData: Record<string, PlayerMatchData>;
  laningPhaseEndTick: number;
}

function entityNode({ x, y, width, height, index, payload }: any) {
  const imageSize = 40; // Size of the hero image
  const imageX = x + width + 6; // Position to the right of the node bar
  const imageY = y + (height - imageSize) / 2; // Vertically center the image

  return (
    <Layer key={`EntityNode${index}`}>
      <Rectangle x={x} y={y} width={width} height={height} fill={payload.fill} fillOpacity="1" />
      {payload.heroImage && payload.heroImage !== "N/A" && (
        <image
          href={payload.heroImage}
          x={imageX}
          y={imageY}
          width={imageSize}
          height={imageSize}
          aria-label={payload.name}
        />
      )}
      <text
        textAnchor={'start'}
        x={imageX + (payload.heroImage !== "N/A" ? imageSize + 6 : 0)}
        y={y + height / 2}
        fontSize="14"
        stroke="#333"
      >
        {payload.name}
      </text>
      <text
        textAnchor={'start'}
        x={imageX + (payload.heroImage !== "N/A" ? imageSize + 6 : 0)}
        y={y + height / 2 + 13}
        fontSize="12"
        stroke="#333"
        strokeOpacity="0.5"
      >
        {`${payload.value}`}
      </text>
    </Layer>
  );
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  selectedLane,
  players,
  perPlayerData,
  laningPhaseEndTick,
}) => {
  // Calculate player-to-player damage trades during laning phase
  const sankeyData = useMemo<SankeyData>(() => {
    // Filter players by lane and team
    const amberPlayers = players
      .filter(p => p.team === 2 && p.lane === selectedLane)
      .slice(0, 2);

    const sapphirePlayers = players
      .filter(p => p.team === 3 && p.lane === selectedLane)
      .slice(0, 2);

    const allLanePlayers = [...amberPlayers, ...sapphirePlayers];

    // Build nodes array (only players, no NPCs)
    const nodes: SankeyNode[] = [];
    const amberColor = '#FF8C00';
    const sapphireColor = '#4169E1';

    // Amber team (left side)
    amberPlayers.forEach(p => nodes.push({
      name: p.hero.name,
      heroImage: p.hero.images.icon_hero_card_webp,
      fill: amberColor
    }));
    while (nodes.length < 2) nodes.push({ name: 'Player (Amber)', heroImage: "N/A", fill: amberColor });

    // Sapphire team (right side)
    sapphirePlayers.forEach(p => nodes.push({
      name: p.hero.name,
      heroImage: p.hero.images.icon_hero_card_webp,
      fill: sapphireColor
    }));
    while (nodes.length < 4) nodes.push({ name: 'Player (Sapphire)', heroImage: "N/A", fill: sapphireColor });

    // Track player-to-player damage
    const damageMap = new Map<string, number>(); // "sourceIdx-targetIdx" -> total damage

    // Helper to get player node index
    const getPlayerNodeIndex = (customId: string): number => {
      const amberIdx = amberPlayers.findIndex(p => p.custom_id === customId);
      if (amberIdx !== -1) return amberIdx;

      const sapphireIdx = sapphirePlayers.findIndex(p => p.custom_id === customId);
      if (sapphireIdx !== -1) return sapphireIdx + 2;

      return -1;
    };

    // Process damage for all players in the lane during laning phase
    allLanePlayers.forEach((player) => {
      const attackerNodeIdx = getPlayerNodeIndex(player.custom_id);
      if (attackerNodeIdx === -1) return;

      const playerMatchData = perPlayerData[player.custom_id];
      if (!playerMatchData || !playerMatchData.damage) return;

      // Aggregate damage from tick 0 to laningPhaseEndTick
      for (let tick = 0; tick <= laningPhaseEndTick && tick < playerMatchData.damage.length; tick++) {
        const tickDamage = playerMatchData.damage[tick];
        if (!tickDamage) continue;

        // Iterate through victims
        Object.entries(tickDamage).forEach(([victimId, damageRecords]) => {
          const totalDamage = damageRecords.reduce((sum, record) => sum + (record.damage || 0), 0);
          if (totalDamage <= 0) return;

          // Check if victim is a player in this lane
          const victimNodeIdx = getPlayerNodeIndex(victimId);

          if (victimNodeIdx !== -1) {
            // Player-to-player damage
            const key = `${attackerNodeIdx}-${victimNodeIdx}`;
            damageMap.set(key, (damageMap.get(key) || 0) + totalDamage);
          }
        });
      }
    });

    // Convert damageMap to links with bidirectional handling
    const processedPairs = new Set<string>();
    const links: SankeyLink[] = [];

    damageMap.forEach((value, key) => {
      const [source, target] = key.split('-').map(Number);

      // Validate indices
      if (
        isNaN(source) || isNaN(target) ||
        source < 0 || source >= nodes.length ||
        target < 0 || target >= nodes.length ||
        source === target
      ) {
        return;
      }

      // Create a normalized key to check if we've already processed this pair
      const pairKey = source < target ? `${source}-${target}` : `${target}-${source}`;

      if (processedPairs.has(pairKey)) {
        return;
      }
      processedPairs.add(pairKey);

      // Check for reverse damage
      const reverseKey = `${target}-${source}`;
      const reverseDamage = damageMap.get(reverseKey) || 0;

      // Calculate net damage
      const netDamage = value - reverseDamage;

      if (Math.abs(netDamage) > 0) {
        // Direction is determined by who dealt more damage
        if (netDamage > 0) {
          links.push({ source, target, value: netDamage });
        } else {
          links.push({ source: target, target: source, value: -netDamage });
        }
      }
    });

    return { nodes, links };
  }, [selectedLane, players, perPlayerData, laningPhaseEndTick]);

  if (sankeyData.links.length === 0) {
    return (
      <div className="w-3/5 max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">
          No hero-to-hero damage trades during laning phase
        </p>
      </div>
    );
  }

  return (
    <div className="w-3/5 max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
      <ResponsiveContainer width="100%" height={400}>
        <Sankey
          data={sankeyData}
          nodeWidth={15}
          nodePadding={50}
          margin={{ top: 10, right: 150, bottom: 10, left: 150 }}
          node={entityNode}
          link={{ stroke: '#77777744', strokeWidth: 70 }}
        >
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
};

export default SankeyDiagram;
