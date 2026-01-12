import React from 'react';

export type Team = 2 | 3; // 2 = Amber, 3 = Sapphire

interface TeamSelectorProps {
  selectedTeam: Team;
  onTeamChange: (team: Team) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  selectedTeam,
  onTeamChange,
}) => {
  const teams: { value: Team; label: string; color: string }[] = [
    { value: 2, label: 'Amber', color: '#FF8C00' },
    { value: 3, label: 'Sapphire', color: '#4169E1' },
  ];

  return (
    <div className="flex gap-2 items-center">
      <label className="text-sm font-semibold text-gray-700">Team:</label>
      <div className="flex gap-2">
        {teams.map((team) => (
          <button
            key={team.value}
            onClick={() => onTeamChange(team.value)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              selectedTeam === team.value
                ? 'text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            style={
              selectedTeam === team.value
                ? { backgroundColor: team.color }
                : undefined
            }
          >
            {team.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TeamSelector;
