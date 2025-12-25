use core::panic;
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::BufReader;
use serde::Serialize;

use anyhow::{Result};
use haste::demofile::DemoFile;
use haste::demostream::CmdHeader;
use haste::fxhash;
use haste::entities::{self, ehandle_to_index, DeltaHeader, Entity, EntityContainer, fkey_from_path, deadlock_coord_from_cell};
use haste::parser::{Context, Parser, Visitor};
use haste::stringtables::StringTable;
use haste::valveprotos::deadlock::{
    CitadelUserMessageIds,
    CCitadelUserMessageDamage,
    CCitadelUserMsgPostMatchDetails,
    CMsgMatchMetaDataContents,
};
use haste::valveprotos::prost::Message;

//const DEADLOCK_PLAYERPAWN_ENTITY: u64 = fxhash::hash_bytes(b"CCitadelPlayerPawn");

// player = [
//
// ]
//
// window = [
//   damage_delt: [
//     <damage_dealer_player_id>: [
//       <damage_receiver_player_id>: [
//         {
//
// optional int32 damage = 1;
// optional int32 type = 3;
// optional int32 citadel_type = 4;
// optional int32 entindex_victim = 6 [default = -1];      # map this to a player_id
// optional int32 entindex_inflictor = 7 [default = -1];   # maybe delete, otherwise convert this to a string?
// optional int32 entindex_attacker = 8 [default = -1];    # map this to a player_id
// optional uint32 ability_id = 14;
// optional uint32 attacker_class = 15;
// optional uint32 victim_class = 16;
// optional float effectiveness = 25;
// optional int32 server_tick = 29;   # this is used to calculate the window, won't be included in the data structure
//
//         }
//       ]
//     ]
//   ]
// ]
//

#[derive(Default, Debug, Serialize)]
struct Player {
    entity_id: String,
    custom_id: String,
    name: String,
    steam_id_32: u32,
    hero_id: u32,
    lobby_player_slot: u32,
    team: u32,
    lane: i32,
    zipline_lane_color: i32,
}

#[derive(Default, Debug, Serialize)]
struct PlayerPosition {
    custom_id: String,
    x: f32,
    y: f32,
    z: f32,
    is_npc: bool,
}

#[derive(Debug, Serialize, Clone)]
struct BossSnapshot {
    entity_index: i32,
    boss_name_hash: u64,  // serializer_name.hash
    team: u32,
    lane: u32,
    x: f32,
    y: f32,
    z: f32,
    spawn_time_s: u32,
    max_health: i32,
    life_state_on_create: i32,
    death_time_s: Option<u32>,
    life_state_on_delete: Option<i32>,
}

#[derive(Debug)]
struct BossTracker {
    // Field keys (pre-computed)
    health_key: u64,
    max_health_key: u64,
    life_state_key: u64,
    lane_key: u64,

    // Active bosses by entity index -> snapshot
    bosses: HashMap<i32, BossSnapshot>,

    // Sparse damage-driven health samples: entity_index -> Vec<(time_s, health)>
    health_samples: HashMap<i32, Vec<(u32, i32)>>,

    // Per-second health timeline: Vec<HashMap<entity_index_string, current_health>>
    health_timeline: Vec<HashMap<String, i32>>,

    // Boss type hashes
    guardian_hash: u64,
    shrine_hash: u64,
    walker_hash: u64,
    base_guardian_hash: u64,
    patron_hash: u64,
}

impl BossTracker {
    fn new() -> Self {
        Self {
            health_key: fkey_from_path(&["m_iHealth"]),
            max_health_key: fkey_from_path(&["m_iMaxHealth"]),
            life_state_key: fkey_from_path(&["m_lifeState"]),
            lane_key: fkey_from_path(&["m_iLane"]),
            bosses: HashMap::new(),
            health_samples: HashMap::new(),
            health_timeline: Vec::new(),
            guardian_hash: CNPC_TROOPERBOSS_ENTITY,
            shrine_hash: CCITADEL_DESTROYABLE_BUILDING_ENTITY,
            walker_hash: CNPC_BOSS_TIER2_ENTITY,
            base_guardian_hash: CNPC_TROOPERBARRACKBOSS_ENTITY,
            patron_hash: CNPC_BOSS_TIER3_ENTITY,
        }
    }

    fn is_boss_entity(&self, hash: u64) -> bool {
        hash == self.guardian_hash
            || hash == self.shrine_hash
            || hash == self.walker_hash
            || hash == self.base_guardian_hash
            || hash == self.patron_hash
    }

    fn handle_boss_create(&mut self, entity: &Entity, current_time_s: u32) {
        let hash = entity.serializer().serializer_name.hash;
        if !self.is_boss_entity(hash) {
            return;
        }

        let position = get_entity_position(entity);
        let team = entity.get_value(&TEAM_KEY).unwrap_or(0);
        let lane = entity.get_value(&self.lane_key).unwrap_or(0);
        let health = entity.get_value::<i32>(&self.health_key).unwrap_or(0);
        let max_health = entity.get_value::<i32>(&self.max_health_key).unwrap_or(0);
        let life_state = entity.get_value::<i32>(&self.life_state_key).unwrap_or(0);

        // println!("lane: {}", lane);
        // panic!("debug panic to inspect state");

        let snapshot = BossSnapshot {
            entity_index: entity.index(),
            boss_name_hash: hash,
            team,
            lane,
            x: position[0],
            y: position[1],
            z: position[2],
            spawn_time_s: current_time_s,
            max_health,
            life_state_on_create: life_state,
            death_time_s: None,
            life_state_on_delete: None,
        };

        // Record initial health sample
        self.health_samples
            .entry(entity.index())
            .or_insert_with(Vec::new)
            .push((current_time_s, health));

        self.bosses.insert(entity.index(), snapshot);
    }

    fn handle_boss_delete(&mut self, entity: &Entity, current_time_s: u32) {
        let entity_index = entity.index();
        if let Some(boss) = self.bosses.get_mut(&entity_index) {
            boss.death_time_s = Some(current_time_s);
            boss.life_state_on_delete = entity.get_value::<i32>(&self.life_state_key);
        }
    }

    fn record_boss_damage(
        &mut self,
        victim_entity_index: i32,
        ctx: &Context,
        current_time_s: u32,
    ) -> Result<()> {
        // Only record if this is a tracked boss
        if !self.bosses.contains_key(&victim_entity_index) {
            return Ok(());
        }

        let entities = ctx.entities().unwrap();
        if let Some(victim) = entities.get(&victim_entity_index) {
            let health = victim.get_value::<i32>(&self.health_key).unwrap_or(0);

            self.health_samples
                .entry(victim_entity_index)
                .or_insert_with(Vec::new)
                .push((current_time_s, health));
        }

        Ok(())
    }

    fn build_health_window(&mut self, window_s: u32) {
        let mut window_health: HashMap<String, i32> = HashMap::new();

        for (entity_index, samples) in &self.health_samples {
            // Find the most recent sample <= window_s (carry-forward last known health)
            if let Some((_, health)) = samples.iter().rev().find(|(time, _)| *time <= window_s) {
                window_health.insert(entity_index.to_string(), *health);
            }
        }

        self.health_timeline.push(window_health);
    }

    fn get_output(&self) -> serde_json::Value {
        serde_json::json!({
            "snapshots": self.bosses.values().collect::<Vec<_>>(),
            "health_timeline": self.health_timeline,
        })
    }
}

// #[derive(Clone, Copy, Debug, Default, Serialize)]
// struct Vector4 {
//     x: Option<f32>,
//     y: Option<f32>,
//     z: Option<f32>,
//     w: Option<f32>,
// }

#[derive(Default, Debug, Serialize)]
struct DamageRecord {
    damage: i32,
    pre_damage: i32,
    r#type: i32,
    citadel_type: i32,
    // origin: Option<Vector4>,
    // entindex_victim: i32,
    entindex_inflictor: i32,
    // entindex_attacker: i32,
    entindex_ability: i32,
    damage_absorbed: i32,
    victim_health_max: i32,
    victim_health_new: i32,
    flags: u64,
    ability_id: u32,
    attacker_class: u32,
    victim_class: u32,
    victim_shield_max: i32,
    victim_shield_new: i32,
    hits: i32,
    health_lost: i32,
    //  inflictor_name: String,
    //  effectiveness: f32,
}

#[derive(Debug)]
struct MyVisitor {
    total_game_time_s: u32,
    game_start_time_s: Option<u32>,
    damage_window: HashMap<u32, HashMap<u32, Vec<DamageRecord>>>,
    damage: Vec<HashMap<u32, HashMap<u32, Vec<DamageRecord>>>>,
    players: Vec<Player>,
    entity_name_hash_to_player_slot: HashMap<u32, u32>,
    positions_window: Vec<PlayerPosition>,
    positions: Vec<Vec<PlayerPosition>>,
    boss_tracker: BossTracker,
    lane_data_updated: bool,
}

impl Default for MyVisitor {
    fn default() -> Self {
        Self {
            total_game_time_s: 0,
            game_start_time_s: None,
            damage_window: HashMap::new(),
            damage: Vec::new(),
            players: Vec::new(),
            entity_name_hash_to_player_slot: HashMap::new(),
            positions_window: Vec::new(),
            positions: Vec::new(),
            boss_tracker: BossTracker::new(),
            lane_data_updated: false,
        }
    }
}

const DEADLOCK_GAMERULES_ENTITY: u64 = fxhash::hash_bytes(b"CCitadelGameRulesProxy");
const OWNER_ENTITY_KEY: u64 = entities::fkey_from_path(&["m_hOwnerEntity"]);
const PLAYER_NAME_KEY: u64 = entities::fkey_from_path(&["m_iszPlayerName"]);
const STEAM_ID_KEY: u64 = entities::fkey_from_path(&["m_steamID"]);
const CONTROLLER_HANDLE_KEY: u64 = entities::fkey_from_path(&["m_hPawn"]);
const TEAM_KEY: u64 = entities::fkey_from_path(&["m_iTeamNum"]);
const ORIGINAL_LANE_ASSIGNMENT_KEY: u64 = entities::fkey_from_path(&["m_nOriginalLaneAssignment"]);
const ASSIGNED_LANE_KEY: u64 = entities::fkey_from_path(&["m_nAssignedLane"]);
const LANE_SWAP_LOCKED_KEY: u64 = entities::fkey_from_path(&["m_bLaneSwapLocked"]);
const HERO_ID_KEY: u64 = entities::fkey_from_path(&["m_nHeroID"]);
const LOBBY_PLAYER_SLOT_KEY: u64 = entities::fkey_from_path(&["m_unLobbyPlayerSlot"]);
const ZIPLINE_LANE_COLOR_KEY: u64 = entities::fkey_from_path(&["m_eZipLineLaneColor"]);

const CCITADELPLAYERPAWN_ENTITY: u64 = fxhash::hash_bytes(b"CCitadelPlayerPawn");
const CNPC_TROOPER_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_Trooper");
const CNPC_TROOPERBOSS_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_TrooperBoss");
const CNPC_TROOPERNEUTRAL_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_TrooperNeutral");
const CNPC_MIDBOSS_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_MidBoss");
const CITEMXP_ENTITY: u64 = fxhash::hash_bytes(b"CItemXP");
const CCITADEL_DESTROYABLE_BUILDING_ENTITY: u64 = fxhash::hash_bytes(b"CCitadel_Destroyable_Building");
const CNPC_BOSS_TIER2_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_Boss_Tier2");
const CNPC_TROOPERBARRACKBOSS_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_TrooperBarrackBoss");
const CNPC_BOSS_TIER3_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_Boss_Tier3");
const CNPC_NEUTRAL_SINNERSSACRIFICE_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_Neutral_SinnersSacrifice");
const CNPC_BASE_DEFENSE_SENTRY_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_BaseDefenseSentry");
const CNPC_SHIELDEDSENTRY_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_ShieldedSentry");

fn steamid64_to_accountid(steamid64: Option<u64>) -> u32 {
    match steamid64 {
        Some(id) => (id - 76561197960265728) as u32,
        _ => 0,
    }
}

fn get_steam_id32(entity: &Entity) -> Option<u32> {
    let steamid64 = entity.get_value::<u64>(&STEAM_ID_KEY);
    return Some(steamid64_to_accountid(steamid64));
}

// NOTE: Unsure if this works as intended. Might need some adjustments.
fn print_entity_name(entities: &EntityContainer) {
    for (_index, entity) in entities.iter() {
        let serializer_name = &entity.serializer().serializer_name.str;
        println!("Entity index={} name={}", entity.index(), serializer_name);
    }
}

fn print_citadel_player_controller_index(entities: &EntityContainer) {
    for (_index, entity) in entities.iter() {
        let serializer_name = &entity.serializer().serializer_name.str;
        if serializer_name.as_ref() == "CCitadelPlayerController" {
            println!("Found CCitadelPlayerController at index: {}", entity.index());
            if let Some(steamid64) = entity.get_value::<u64>(&STEAM_ID_KEY) {
                println!("  m_steamID: {}", steamid64);
            } else {
                println!("  m_steamID: <not found>");
            }
        }
    }
}

fn get_steamid_from_pawn(pawn: &Entity, entities: &EntityContainer) -> Option<u64> {
    let controller_handle: u32 = pawn.get_value(&CONTROLLER_HANDLE_KEY)?;
    let controller_index = ehandle_to_index(controller_handle);

    // Get the controller entity
    let player_controller = entities.get(&controller_index)?;

    // Get the steamID from the controller
    player_controller.get_value::<u64>(&STEAM_ID_KEY)
}

fn get_entity_coord(entity: &Entity, cell_key: &u64, vec_key: &u64) -> f32 {
    let cell: u16 = entity.get_value(cell_key).unwrap();
    let vec: f32 = entity.get_value(vec_key).unwrap();
    let coord = deadlock_coord_from_cell(cell, vec);

    // Some(coord)
    coord
}

fn get_entity_position(entity: &Entity) -> [f32; 3] {
    const CX: u64 = fkey_from_path(&["CBodyComponent", "m_cellX"]);
    const CY: u64 = fkey_from_path(&["CBodyComponent", "m_cellY"]);
    const CZ: u64 = fkey_from_path(&["CBodyComponent", "m_cellZ"]);

    const VX: u64 = fkey_from_path(&["CBodyComponent", "m_vecX"]);
    const VY: u64 = fkey_from_path(&["CBodyComponent", "m_vecY"]);
    const VZ: u64 = fkey_from_path(&["CBodyComponent", "m_vecZ"]);

    let x = get_entity_coord(entity, &CX, &VX);
    let y = get_entity_coord(entity, &CY, &VY);
    let z = get_entity_coord(entity, &CZ, &VZ);

    // Some([x, y, z])
    [x, y, z]
}

impl MyVisitor {
    pub fn get_game_data_json(&self) -> serde_json::Value {
        serde_json::json!({
            "total_game_time_s": self.total_game_time_s,
            "game_start_time_s": self.game_start_time_s,
            "damage": self.damage,
            "players": self.players,
            "positions": self.positions,
            "bosses": self.boss_tracker.get_output(),
        })
    }

    fn check_and_update_lane_lock(&mut self, entity: &Entity) -> Result<()> {
        if entity.serializer().serializer_name.str.as_ref() != "CCitadelPlayerController" {
            return Ok(());
        }

        let is_locked: bool = entity.get_value(&LANE_SWAP_LOCKED_KEY).unwrap_or(false);
        if !is_locked {
            return Ok(());
        }

        // Player is lane swap locked. Update `player.lane`
        let lobby_slot: u32 = entity.get_value(&LOBBY_PLAYER_SLOT_KEY).unwrap_or(9999);
        for player in &mut self.players {
            if player.lobby_player_slot == lobby_slot {
                // Prefer m_nAssignedLane (final lane after swaps)
                player.lane = entity
                    .get_value(&ASSIGNED_LANE_KEY)
                    .filter(|&v| v != 0)
                    .or_else(|| entity.get_value(&ORIGINAL_LANE_ASSIGNMENT_KEY))
                    .unwrap_or(999999);

                // TODO: Future enhancement - store original_lane_assignment for lane swap tracking
                // player.original_lane = entity.get_value(&ORIGINAL_LANE_ASSIGNMENT_KEY).unwrap_or(0);

                break;
            }
        }

        // Check if all players have lane data now (all 12 should not be 999999)
        let all_lanes_set = self.players.iter().all(|p| p.lane != 999999);
        if all_lanes_set {
            self.lane_data_updated = true;
        }

        Ok(())
    }

    fn should_track_position(&self, entity: &Entity) -> bool {
        matches!(
            entity.serializer().serializer_name.hash,
            CCITADELPLAYERPAWN_ENTITY
                | CNPC_TROOPER_ENTITY                    // Lane Troopers
                | CNPC_TROOPERBOSS_ENTITY                // Guardians
                | CNPC_TROOPERNEUTRAL_ENTITY
                | CNPC_MIDBOSS_ENTITY
                | CITEMXP_ENTITY
                | CCITADEL_DESTROYABLE_BUILDING_ENTITY   // Shrines
                | CNPC_BOSS_TIER2_ENTITY                 // Walkers
                | CNPC_TROOPERBARRACKBOSS_ENTITY         // Base Guardians
                | CNPC_BOSS_TIER3_ENTITY                 // Patrons
                | CNPC_NEUTRAL_SINNERSSACRIFICE_ENTITY
                | CNPC_BASE_DEFENSE_SENTRY_ENTITY
                | CNPC_SHIELDEDSENTRY_ENTITY
        )
    }

    fn is_npc_entity(&self, entity: &Entity) -> bool {
        entity.serializer().serializer_name.hash != CCITADELPLAYERPAWN_ENTITY
    }

    fn handle_game_rules(&mut self, entity: &Entity) -> anyhow::Result<()> {
        debug_assert!(entity.serializer_name_heq(DEADLOCK_GAMERULES_ENTITY));

        let game_start_time_s_f: f32 =
            entity.try_get_value(&fkey_from_path(&["m_pGameRules", "m_flGameStartTime"]))?;
        // NOTE: 0.001 is an arbitrary number; nothing special.
        if game_start_time_s_f < 0.001 {
            return Ok(());
        }

        let rounded: u32 = game_start_time_s_f.ceil() as u32;
        self.game_start_time_s = Some(rounded);

        Ok(())
    }

    fn get_custom_id(
        &mut self,
        ctx: &Context,
        entity: &Entity
    ) -> u32 {
        // NOTE: This function returns a `custom_id` which is either:
        // - for players: their lobby player slot
        // - for NPCs: a unique ID starting from 20 upwards

        let serializer_entity_name = &entity.serializer().serializer_name;
        if serializer_entity_name.hash == CCITADELPLAYERPAWN_ENTITY {
            // FIXME: Do we use `entity_name_hash_to_player_slot`? It's not used on the Python side.
            // So do we need it here?
            return *self.entity_name_hash_to_player_slot
                .entry(entity.index() as u32)
                .or_insert_with(|| {
                    let owner_entity_index: u32 = entity.get_value::<u32>(&OWNER_ENTITY_KEY).unwrap();
                    let owner_entity = ctx.entities().unwrap()
                        .get(&ehandle_to_index(owner_entity_index))
                        .unwrap();
                    let lobby_player_slot = owner_entity.get_value(&LOBBY_PLAYER_SLOT_KEY).unwrap_or(999999);

                    self.players.push(Player {
                        entity_id: entity.index().to_string(),
                        custom_id: lobby_player_slot.to_string(),
                        name: owner_entity.get_value(&PLAYER_NAME_KEY).unwrap(),
                        steam_id_32: get_steam_id32(owner_entity).unwrap_or(999999),
                        hero_id: owner_entity.get_value(&HERO_ID_KEY).unwrap_or(999999),
                        lobby_player_slot: lobby_player_slot,
                        team: owner_entity.get_value(&TEAM_KEY).unwrap_or(999999),
                        lane: 999999,
                        zipline_lane_color: owner_entity.get_value(&ZIPLINE_LANE_COLOR_KEY).unwrap_or(999999),
                    });

                    lobby_player_slot
                });
        } else {
            return match serializer_entity_name.hash {
                CNPC_TROOPER_ENTITY => 20, // "<CNPC_Trooper>".to_string(),
                // Guardians
                CNPC_TROOPERBOSS_ENTITY => 21, // "<CNPC_TrooperBoss>".to_string(),
                CNPC_TROOPERNEUTRAL_ENTITY => 22, // "<CNPC_TrooperNeutral>".to_string(),
                CNPC_MIDBOSS_ENTITY => 23, // "<CNPC_MidBoss>".to_string(),
                // *Really* looks like souls...
                CITEMXP_ENTITY => 24, // "<CItemXP>".to_string(),
                // Shrines
                CCITADEL_DESTROYABLE_BUILDING_ENTITY => 25, // "<CCitadel_Destroyable_Building>".to_string(),
                // Walkers
                CNPC_BOSS_TIER2_ENTITY => 26, // "<CNPC_Boss_Tier2>".to_string(),
                // Base Guardians
                CNPC_TROOPERBARRACKBOSS_ENTITY => 27, // "<CNPC_TrooperBarrackBoss>".to_string(),
                // Patrons
                CNPC_BOSS_TIER3_ENTITY => 28, // "<CNPC_Boss_Tier3>".to_string(),
                CNPC_NEUTRAL_SINNERSSACRIFICE_ENTITY => 29, // "<CNPC_Neutral_SinnersSacrifice>".to_string(),
                CNPC_BASE_DEFENSE_SENTRY_ENTITY => 30, // "<CNPC_BaseDefenseSentry>".to_string(),
                CNPC_SHIELDEDSENTRY_ENTITY => 31, // "<CNPC_ShieldedSentry>".to_string(),
                _ => panic!("Unknown entity - Name: {}, Hash: {}", serializer_entity_name.str, serializer_entity_name.hash),
            }
        }
    }

    fn push_damage_record(
        &mut self,
        ctx: &Context,
        attacker: &Entity,
        victim: &Entity,
        record: DamageRecord
    ) -> Result<()> {
        let attacker_player_slot = self.get_custom_id(ctx, attacker);
        let victim_player_slot = self.get_custom_id(ctx, victim);

        let victims_list = self.damage_window
            .entry(attacker_player_slot)
            .or_insert(HashMap::new());

        let victim_damage = victims_list
            .entry(victim_player_slot)
            .or_insert(Vec::new());

        //println!("Damage Record: {:?}", record);

        victim_damage.push(record);

        Ok(())
    }
}

impl Visitor for &mut MyVisitor {
    fn on_tick_end(
        &mut self,
        ctx: &Context
    ) -> Result<()> {
        // println!("on_tick_end \t\t new: {:?} \t interval: {:?}  \t time?: {:?}", ctx.tick(), ctx.tick_interval(), ctx.tick() as f32 * ctx.tick_interval());

        let next_window = (((1 + ctx.tick()) as f32) * ctx.tick_interval()).round() as u32;
        let this_window = ((ctx.tick() as f32) * ctx.tick_interval()).round() as u32;
        let game_started = self.game_start_time_s.is_some() && (this_window >= (self.game_start_time_s.unwrap()));

        if !game_started {
            return Ok(());
        }

        if next_window != this_window {
            // Build per-second boss health timeline
            self.boss_tracker.build_health_window(this_window);

            for (_index, entity) in ctx.entities().unwrap().iter() {
                if !self.should_track_position(entity) {
                    continue;
                }
                let position = get_entity_position(entity);
                let custom_id = self.get_custom_id(ctx, entity);

                self.positions_window.push(PlayerPosition {
                    custom_id: custom_id.to_string(),
                    x: position[0],
                    y: position[1],
                    z: position[2],
                    is_npc: self.is_npc_entity(entity),
                });
            }

            // restart the current window
            // println!("Damage Window: {:?}", self.damage_window);
            // println!("Players: {:?}", self.players);
            self.total_game_time_s = this_window;
            self.damage.push(std::mem::replace(&mut self.damage_window, HashMap::new()));
            self.positions.push(std::mem::replace(&mut self.positions_window, Vec::new()));
        }

        Ok(())
    }

    fn on_entity(
        &mut self,
        ctx: &Context,
        delta_header: DeltaHeader,
        entity: &Entity
    ) -> Result<()> {
        // println!("on_entity \t\t prev: {:?} \t new: {:?}", delta_header, entity);

        // TODO: This looks like it's checked on *every* entity event.
        // Optimize by checking only when this entity is created?
        // Or updated? Or when the game starts timestamp on this entity is updated?
        if entity.serializer_name_heq(DEADLOCK_GAMERULES_ENTITY) {
            self.handle_game_rules(entity)?;
        }

        // Track boss lifecycle
        match delta_header {
            DeltaHeader::CREATE => {
                self.boss_tracker.handle_boss_create(entity, self.total_game_time_s);
            }
            DeltaHeader::DELETE => {
                self.boss_tracker.handle_boss_delete(entity, self.total_game_time_s);
            }
            DeltaHeader::UPDATE => {
                // At a certain point in the game, you "can't" swap lanes and are locked in
                if self.lane_data_updated == false {
                    self.check_and_update_lane_lock(entity)?;
                }
            }
            _ => {}
        }

        Ok(())
    }

    fn on_cmd(
        &mut self,
        ctx: &Context,
        cmd_header: &CmdHeader,
        data: &[u8]
    ) -> Result<()> {
        // println!("on_cmd \t\t  {:?} \t  {:?}", cmd_header, data);

        Ok(())
    }

    fn on_packet(
        &mut self,
        ctx: &Context,
        packet_type: u32,
        data: &[u8]
    ) -> Result<()> {
        if packet_type == CitadelUserMessageIds::KEUserMsgDamage as u32 {
            let msg = CCitadelUserMessageDamage::decode(data)?;

            //if msg.entindex_attacker == Some(1958 as i32) {
                // if msg.victim_class() == (4 as u32) {
                    let entities = ctx.entities().unwrap();

                    let string_tables = ctx.string_tables().unwrap();
                    let entity_names = string_tables.find_table("EntityNames").unwrap();

                    let attacker = entities
                        .get(&msg.entindex_attacker());

                    let victim = entities
                        .get(&msg.entindex_victim());

                    let inflictor = entities
                        .get(&msg.entindex_inflictor());

                    let ability = entities
                        .get(&msg.entindex_ability());

                    if attacker.is_none() || victim.is_none() {
                        // println!("Attacker or Victim was None");
                        return Ok(())
                    }

                    // Check if victim is a boss and record health sample
                    let victim_hash = victim.unwrap().serializer().serializer_name.hash;
                    if self.boss_tracker.is_boss_entity(victim_hash) {
                        self.boss_tracker.record_boss_damage(
                            msg.entindex_victim(),
                            ctx,
                            self.total_game_time_s,
                        )?;
                    }

                    // FIXME: Need to change this so we're not sending entity indexes
                    // Also need a system to map entity hashes to string names that we can
                    // save in our backend DB so our frontend can cache/display them properly
                    let record = DamageRecord {
                        damage: msg.damage(),
                        pre_damage: msg.pre_damage(),
                        r#type: msg.r#type(),
                        citadel_type: msg.citadel_type(),
                        // origin: msg.origin.as_ref().map(|v| Vector4 { x: v.x, y: v.y, z: v.z, w: v.w }) ,
                        // entindex_victim: get_custom_id(msg.entindex_victim()),
                        entindex_inflictor: msg.entindex_inflictor(),
                        // entindex_attacker: get_custom_id(msg.entindex_attacker()),
                        entindex_ability: msg.entindex_ability(),
                        damage_absorbed: msg.damage_absorbed(),
                        victim_health_max: msg.victim_health_max(),
                        victim_health_new: msg.victim_health_new(),
                        flags: msg.flags(),
                        ability_id: msg.ability_id(),
                        attacker_class: msg.attacker_class(),
                        victim_class: msg.victim_class(),
                        victim_shield_max: msg.victim_shield_max(),
                        victim_shield_new: msg.victim_shield_new(),
                        hits: msg.hits(),
                        health_lost: msg.health_lost(),
                        // effectiveness: msg.effectiveness()
                        // inflictor_name: todo!(),
                    };

                    // panic!("Debug panic to inspect state");
                    if let Err(error) = self.push_damage_record(ctx, attacker.unwrap(), victim.unwrap(), record) {
                        println!("Failed to push damage record: {:?}", error);
                        return Err(error);
                    };
                // }
            //}
        }
        // Damage matrix is not a user message ID; it's embedded in PostMatchDetails.
        // NOTE: I'm trying to be pedantic about the usage of "game" vs "match" in our code.
        // The only reason we're referring to a "game" here as a "match" is because
        // that's the terminology used in the protos. However, in typical tournament play
        // a "match" consists of multiple "games". This is the only section of code where
        // we refer to a "game" as a"match".
        if packet_type == CitadelUserMessageIds::KEUserMsgPostMatchDetails as u32 {
            let details_msg = CCitadelUserMsgPostMatchDetails::decode(data)?;
            if let Some(bytes) = details_msg.match_details {
                // This blob is a CMsgMatchMetaDataContents message.
                let mut cursor = std::io::Cursor::new(bytes);
                if let Ok(meta) = CMsgMatchMetaDataContents::decode(&mut cursor) {
                    if let Some(match_info) = meta.match_info {
                        if let Some(damage_matrix) = match_info.damage_matrix {
                            // Minimal sanity log so we know we can access it.
                            println!(
                                "PostMatch damage_matrix: dealers={} samples={}",
                                damage_matrix.damage_dealers.len(),
                                damage_matrix.sample_time_s.len()
                            );
                            // TODO: store/use this structure as needed.
                        }
                    }
                }
            }
        }
        Ok(())
    }
}

pub fn parse_replay(replay_full_path: &str) -> Result<serde_json::Value> {
    let file = File::open(replay_full_path)?;
    let buf_reader = BufReader::new(file);
    let demo_file = DemoFile::start_reading(buf_reader)?;
    let mut visitor = MyVisitor::default();
    let mut parser = Parser::from_stream_with_visitor(demo_file, &mut visitor)?;
    parser.run_to_end()?;
    Ok(visitor.get_game_data_json())
}

pub fn debug_print_stuff(msg: CCitadelUserMessageDamage, ctx: &Context, attacker: Option<&Entity>, victim: Option<&Entity>, inflictor: Option<&Entity>, ability: Option<&Entity>, record: &DamageRecord) {
    if let Some(vic) = victim {
        let att_class = msg.attacker_class() as i32;
        let vic_class = msg.victim_class() as i32;
        println!("victim.serializer().serializer_name.str = {}", victim.unwrap().serializer().serializer_name.str);
        println!("attacker.serializer().serializer_name.str = {}", attacker.unwrap().serializer().serializer_name.str);
        println!("attacker index={} class={} victim index={} class={}", msg.entindex_attacker(), att_class, msg.entindex_victim(), vic_class);

        let att_class_thing = unsafe { ctx.entity_classes().unwrap().by_id_unckecked(att_class) };
        // let att_class_serializer_thing = attacker.unwrap().serializer_name_heq(att_class_thing.network_name_hash);
        let att_class_serializer_thing = attacker.unwrap().serializer_name_heq(CNPC_TROOPER_ENTITY);
        let vic_class_thing = unsafe { ctx.entity_classes().unwrap().by_id_unckecked(vic_class) };
        let vic_class_serializer_thing = victim.unwrap().serializer_name_heq(vic_class_thing.network_name_hash);
        // let value = attacker.iter().find(|e| e.serializer_name.hash == att_class_thing.network_name_hash);
        // println!("attacker.iter().find(att_class_serializer_thing): {:#?}", value);

        // Unwrap first
        if let Some(att) = attacker {
            let matches = att.serializer().serializer_name.hash == att_class_thing.network_name_hash;
            println!("attacker class hash matches? {}", matches);
        } else {
            println!("no attacker entity");
        }

        // Or stay in Option-land
        let matches = attacker
            .map(|att| att.serializer().serializer_name.hash == att_class_thing.network_name_hash)
            .unwrap_or(false);
        println!("attacker class hash matches? {}", matches);

        let sers = ctx.serializers().unwrap();
        if let Some(s) = sers.by_name_hash(att_class_thing.network_name_hash) {
            // println!("serialized class values: {:#?}", sers.values());
            println!("class name = {}", s.serializer_name.str);
        }
        if let Some(s) = sers.by_name_hash(vic_class_thing.network_name_hash) {
            // println!("serialized class values: {:#?}", sers.values());
            println!("class name = {}", s.serializer_name.str);
        }

        println!("class_serializer_thing: {:#?}", att_class_serializer_thing);
        println!("entity_class stuff: {:#?}", att_class_thing.network_name_hash);

        let att_ent_serializer = attacker.unwrap().serializer();
        let vic_ent_serializer = victim.unwrap().serializer();
        let att_ent_serializer_name = &att_ent_serializer.serializer_name;
        let vic_ent_serializer_name = &vic_ent_serializer.serializer_name;
        let att_ent_serializer_symbol = &att_ent_serializer.serializer_name.hash;
        let vic_ent_serializer_symbol = &vic_ent_serializer.serializer_name.hash;

        println!("att_ent_serializer_name: {:#?}", att_ent_serializer_name);
        println!("vic_ent_serializer_name: {:#?}", vic_ent_serializer_name);
        println!("att_ent_serializer_symbol: {:#?}", att_ent_serializer_symbol);
        println!("vic_ent_serializer_symbol: {:#?}", vic_ent_serializer_symbol);

        let ability_id  = msg.ability_id();
        panic!("*****Debug panic******");
    }
    println!("damage record: {:?}", record);
    println!("inflictor stuff: {:?}", inflictor.unwrap().serializer().serializer_name.str);
    if ability.is_some() {
        println!("ability stuff: {:?}", ability.unwrap().serializer().serializer_name.str);
    }
    println!("attacker stuff: {:?}", attacker.unwrap().serializer().serializer_name.str);
    println!("victim stuff: {:?}", victim.unwrap().serializer().serializer_name.str);

    // Do NOT use ability_id as a class index; it's an opaque id and may be 0 or large.
    // If you want readable names for attacker/victim classes, resolve those ids via entity_classes:
    if let Some(ec) = ctx.entity_classes() {
        let serializers = ctx.serializers().unwrap();
        for (label, class_id) in [("attacker_class", msg.attacker_class()), ("victim_class", msg.victim_class())] {
            let idx = class_id as usize;
            if idx < ec.classes && idx <= i32::MAX as usize {
                let class_info = unsafe { ec.by_id_unckecked(class_id as i32) };
                if let Some(s) = serializers.by_name_hash(class_info.network_name_hash) {
                    println!("{} => {}", label, s.serializer_name.str);
                }
            }
        }
    }

}