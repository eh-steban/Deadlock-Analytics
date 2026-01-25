import React, { Suspense, lazy } from 'react';
import { Tab } from '@headlessui/react';
import { ParsedPlayer, PlayerMatchData } from '../../domain/player';
import { BossSnapshot } from '../../domain/boss';
import TeamDamageAllocation from './TeamDamageAllocation';

const PlayerDamageDistribution = lazy(() => import('./PlayerDamageDistribution'));
const ObjectiveDamageContribution = lazy(() => import('./ObjectiveDamageContribution'));

interface DamageAnalysisSectionProps {
  players: ParsedPlayer[];
  perPlayerData: Record<string, PlayerMatchData>;
  bossSnapshots: BossSnapshot[];
  totalMatchTime: number;
}

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-64 text-gray-500">
    Loading...
  </div>
);

const tabs = [
  { label: 'Team Damage Allocation' },
  { label: 'Player Damage Distribution' },
  { label: 'Objective Damage Contribution' },
];

const DamageAnalysisSection: React.FC<DamageAnalysisSectionProps> = ({
  players,
  perPlayerData,
  bossSnapshots,
  totalMatchTime,
}) => {
  return (
    <Tab.Group defaultIndex={0}>
      <Tab.List className="flex mx-8 mt-6 bg-white rounded-t-lg shadow-md px-2 pt-2">
        {tabs.map((tab) => (
          <Tab
            key={tab.label}
            className={({ selected }) =>
              `px-4 py-2 text-sm font-medium transition-colors focus:outline-none rounded-t-lg
              ${selected
                ? 'bg-gray-50 border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}`
            }
          >
            {tab.label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel>
          <TeamDamageAllocation
            players={players}
            perPlayerData={perPlayerData}
            bossSnapshots={bossSnapshots}
            totalMatchTime={totalMatchTime}
          />
        </Tab.Panel>
        <Tab.Panel>
          <Suspense fallback={<LoadingFallback />}>
            <PlayerDamageDistribution
              players={players}
              perPlayerData={perPlayerData}
              bossSnapshots={bossSnapshots}
              totalMatchTime={totalMatchTime}
            />
          </Suspense>
        </Tab.Panel>
        <Tab.Panel>
          <Suspense fallback={<LoadingFallback />}>
            <ObjectiveDamageContribution
              players={players}
              perPlayerData={perPlayerData}
              bossSnapshots={bossSnapshots}
              totalMatchTime={totalMatchTime}
            />
          </Suspense>
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};

export default DamageAnalysisSection;
