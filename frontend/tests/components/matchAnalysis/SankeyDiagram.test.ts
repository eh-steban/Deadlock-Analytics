import { describe, expect, it } from 'vitest';
import { formatSankeyTooltip, SankeyTooltipParams } from '../../../src/components/matchAnalysis/SankeyDiagram';

describe('formatSankeyTooltip', () => {
  describe('node tooltips', () => {
    it('displays total damage when hovering over a node with totalDamage', () => {
      const params: SankeyTooltipParams = {
        dataType: 'node',
        name: 'Player A',
        data: { totalDamage: 15000 },
      };

      const result = formatSankeyTooltip(params);

      expect(result).toBe('Player A: 15,000 damage');
    });

    it('formats large damage numbers with locale separators', () => {
      const params: SankeyTooltipParams = {
        dataType: 'node',
        name: 'Heavy Hitter',
        data: { totalDamage: 1234567 },
      };

      const result = formatSankeyTooltip(params);

      expect(result).toBe('Heavy Hitter: 1,234,567 damage');
    });

    it('displays name only for nodes without totalDamage', () => {
      const params: SankeyTooltipParams = {
        dataType: 'node',
        name: 'Unknown Entity',
        data: {},
      };

      const result = formatSankeyTooltip(params);

      expect(result).toBe('Unknown Entity');
    });

    it('displays name when totalDamage is explicitly undefined', () => {
      const params: SankeyTooltipParams = {
        dataType: 'node',
        name: 'No Damage Node',
        data: { totalDamage: undefined },
      };

      const result = formatSankeyTooltip(params);

      expect(result).toBe('No Damage Node');
    });

    it('handles zero damage correctly', () => {
      const params: SankeyTooltipParams = {
        dataType: 'node',
        name: 'Pacifist',
        data: { totalDamage: 0 },
      };

      const result = formatSankeyTooltip(params);

      expect(result).toBe('Pacifist: 0 damage');
    });
  });

  describe('edge tooltips', () => {
    it('displays damage with percentage for edges', () => {
      const params: SankeyTooltipParams = {
        dataType: 'edge',
        name: 'edge',
        data: { value: 5000, percentage: 25.5 },
      };

      const result = formatSankeyTooltip(params);

      expect(result).toBe('Damage: 5,000 (25.5%)');
    });

    it('displays damage without percentage when not provided', () => {
      const params: SankeyTooltipParams = {
        dataType: 'edge',
        name: 'edge',
        data: { value: 3500 },
      };

      const result = formatSankeyTooltip(params);

      expect(result).toBe('Damage: 3,500');
    });

    it('formats percentage to one decimal place', () => {
      const params: SankeyTooltipParams = {
        dataType: 'edge',
        name: 'edge',
        data: { value: 1000, percentage: 33.333 },
      };

      const result = formatSankeyTooltip(params);

      expect(result).toBe('Damage: 1,000 (33.3%)');
    });
  });
});
