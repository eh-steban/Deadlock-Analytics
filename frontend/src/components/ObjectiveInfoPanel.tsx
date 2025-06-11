import React from 'react';
import { DestroyedObjective } from '../types/DestroyedObjective';

interface ObjectiveInfoPanelProps {
  destroyedObjectives: DestroyedObjective[];
  currentObjectiveIndex: number;
}

const ObjectiveInfoPanel: React.FC<ObjectiveInfoPanelProps> = ({ destroyedObjectives, currentObjectiveIndex }) => (
  <div style={{ width: '300px', padding: '1rem', backgroundColor: '#f0f0f0', marginRight: '20px' }}>
    <h3>Current Time: {destroyedObjectives[currentObjectiveIndex]?.destroyed_time_s || 10} seconds</h3>
    <h3>Objective Info</h3>
    {/* Legend for minimap colors */}
    <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}>
      <strong>Legend</strong>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
        <span style={{ display: 'inline-block', width: 16, height: 16, background: 'rgba(0,128,255,0.7)', borderRadius: '50%', marginRight: 8, border: '1px solid #0070c0' }}></span>
        Team 0 Player
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
        <span style={{ display: 'inline-block', width: 16, height: 16, background: 'rgba(0,200,0,0.7)', borderRadius: '50%', marginRight: 8, border: '1px solid #008000' }}></span>
        Team 1 Player
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
        <span style={{ display: 'inline-block', width: 16, height: 16, background: 'red', borderRadius: '50%', marginRight: 8, border: '1px solid #a00' }}></span>
        Objective (Active)
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
        <span style={{ display: 'inline-block', width: 16, height: 16, background: 'black', borderRadius: '50%', marginRight: 8, border: '1px solid #333' }}></span>
        Objective (Destroyed)
      </div>
    </div>
    {destroyedObjectives.filter((_, index) => index <= currentObjectiveIndex).map((obj, idx) => (
      <div key={idx} style={{ marginBottom: '1rem', borderBottom: '1px solid #ccc' }}>
        <strong>ID:</strong> {obj.team_objective_id}<br />
        <strong>Team ID:</strong> {obj.team}<br />
        <strong>Destroyed Time (s):</strong> {obj.destroyed_time_s}<br />
        <strong>Creep Damage:</strong> {obj.creep_damage}<br />
        <strong>Creep Damage Mitigated:</strong> {obj.creep_damage_mitigated}<br />
        <strong>Player Damage:</strong> {obj.player_damage}<br />
        <strong>Player Damage Mitigated:</strong> {obj.player_damage_mitigated}<br />
        <strong>First Damage Time (s):</strong> {obj.first_damage_time_s}<br />
      </div>
    ))}
  </div>
);

export default ObjectiveInfoPanel;
