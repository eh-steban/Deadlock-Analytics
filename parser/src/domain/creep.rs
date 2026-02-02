//! Creep wave tracking domain models

use serde::Serialize;
use std::collections::HashMap;

/// Snapshot of a creep wave at a given time
#[derive(Debug, Clone, Serialize)]
pub struct CreepWaveSnapshot {
    /// Centroid X position
    pub x: f32,
    /// Centroid Y position
    pub y: f32,
    /// Number of creeps in the wave
    pub count: u32,
    /// Team (2 = Amber, 3 = Sapphire)
    pub team: u32,
}

/// Per-lane timeline of creep wave snapshots
/// Key: lane_id as string, Value: per-second snapshots (None if no wave that second)
pub type CreepWaveTimeline = HashMap<String, Vec<Option<CreepWaveSnapshot>>>;

/// Container for all creep wave data
#[derive(Debug, Clone, Serialize, Default)]
pub struct CreepWaveData {
    pub waves: CreepWaveTimeline,
}
