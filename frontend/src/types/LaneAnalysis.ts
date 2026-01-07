// Lane Analysis
export interface NPCDamageStats {
  playerId: string;
  playerName: string;
  team: number;
  heroName: string;
  laneCreeps: number;
  neutrals: number;
  guardian: number;
}

// Sankey
export interface SankeyNode {
  name: string;
  heroImage: string;
  fill?: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

