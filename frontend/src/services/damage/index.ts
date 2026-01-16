// Export domain types
export type {
  DamageTarget,
  PlayerDamageDistribution,
  TeamDamageDistribution,
  PlayerContribution,
  ObjectiveTarget,
  PlayerObjectiveDamage,
  ObjectiveDamageDistribution,
} from '../../domain/damageAnalysis';

// Export aggregation functions
export {
  aggregatePlayerDamage,
  aggregateTeamDamage,
  aggregateObjectiveDamage,
} from './aggregation';
