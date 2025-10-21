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
    lane: u32,
    zipline_lane_color: u32,
}

#[derive(Default, Debug, Serialize)]
struct PlayerPosition {
    custom_id: String,
    x: f32,
    y: f32,
    z: f32,
    is_npc: bool,
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

#[derive(Default, Debug)]
struct MyVisitor {
    seconds: u32,
    damage_window: HashMap<u32, HashMap<u32, Vec<DamageRecord>>>,
    damage: Vec<HashMap<u32, HashMap<u32, Vec<DamageRecord>>>>,
    players: Vec<Player>,
    entity_id_to_custom_player_id: HashMap<u32, u32>,
    positions_window: Vec<PlayerPosition>,
    positions: Vec<Vec<PlayerPosition>>,
}

const OWNER_ENTITY_KEY: u64 = entities::fkey_from_path(&["m_hOwnerEntity"]);
const PLAYER_NAME_KEY: u64 = entities::fkey_from_path(&["m_iszPlayerName"]);
const STEAM_ID_KEY: u64 = entities::fkey_from_path(&["m_steamID"]);
const CONTROLLER_HANDLE_KEY: u64 = entities::fkey_from_path(&["m_hPawn"]);
const TEAM_KEY: u64 = entities::fkey_from_path(&["m_iTeamNum"]);
const ORIGINAL_LANE_ASSIGNMENT_KEY: u64 = entities::fkey_from_path(&["m_nOriginalLaneAssignment"]);
const ASSIGNED_LANE_KEY: u64 = entities::fkey_from_path(&["m_nAssignedLane"]);
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
            "seconds": self.seconds,
            "damage": self.damage,
            "players": self.players,
            "positions": self.positions,
        })
    }

    fn should_track_position(&self, entity: &Entity) -> bool {
        matches!(
            entity.serializer().serializer_name.hash,
            CCITADELPLAYERPAWN_ENTITY
                | CNPC_TROOPER_ENTITY
                | CNPC_TROOPERBOSS_ENTITY
                | CNPC_TROOPERNEUTRAL_ENTITY
                | CNPC_MIDBOSS_ENTITY
                | CITEMXP_ENTITY
                | CCITADEL_DESTROYABLE_BUILDING_ENTITY
                | CNPC_BOSS_TIER2_ENTITY
                | CNPC_TROOPERBARRACKBOSS_ENTITY
                | CNPC_BOSS_TIER3_ENTITY
                | CNPC_NEUTRAL_SINNERSSACRIFICE_ENTITY
                | CNPC_BASE_DEFENSE_SENTRY_ENTITY
        )
    }

    fn is_npc_entity(&self, entity: &Entity) -> bool {
        entity.serializer().serializer_name.hash != CCITADELPLAYERPAWN_ENTITY
    }

    fn get_custom_player_id(
        &mut self,
        ctx: &Context,
        entity: &Entity
    ) -> u32 {
        let serializer_name = &entity.serializer().serializer_name;
        if serializer_name.hash == CCITADELPLAYERPAWN_ENTITY {
            // FIXME: Do we use `entity_id_to_custom_player_id`? It's not used on the Python side.
            // So do we need it here?
            return *self.entity_id_to_custom_player_id
                .entry(entity.index() as u32)
                .or_insert_with(|| {
                    let owner_entity_index: u32 = entity.get_value::<u32>(&OWNER_ENTITY_KEY).unwrap();
                    let owner_entity = ctx.entities().unwrap()
                        .get(&ehandle_to_index(owner_entity_index))
                        .unwrap();

                    let custom_id = self.players.len() as u32;
                    let lobby_player_slot = owner_entity.get_value(&LOBBY_PLAYER_SLOT_KEY).unwrap_or(0);
                    self.players.push(Player {
                        entity_id: entity.index().to_string(),
                        custom_id: custom_id.to_string(),
                        name: owner_entity.get_value(&PLAYER_NAME_KEY).unwrap(),
                        steam_id_32: get_steam_id32(owner_entity).unwrap_or(0),
                        hero_id: entity.get_value(&HERO_ID_KEY).unwrap_or(0),
                        lobby_player_slot: lobby_player_slot,
                        team: owner_entity.get_value(&TEAM_KEY).unwrap_or(0),
                        lane: owner_entity
                            .get_value(&ASSIGNED_LANE_KEY)
                            .filter(|&v| v != 0)
                            .or_else(|| owner_entity.get_value(&ORIGINAL_LANE_ASSIGNMENT_KEY))
                            .unwrap_or(0),
                        zipline_lane_color: entity.get_value(&ZIPLINE_LANE_COLOR_KEY).unwrap_or(0),
                    });

                    lobby_player_slot
                });
        } else {
            return match serializer_name.hash {
                CNPC_TROOPER_ENTITY => 20, // "<CNPC_Trooper>".to_string(),
                CNPC_TROOPERBOSS_ENTITY => 21, // "<CNPC_TrooperBoss>".to_string(),
                CNPC_TROOPERNEUTRAL_ENTITY => 22, // "<CNPC_TrooperNeutral>".to_string(),
                CNPC_MIDBOSS_ENTITY => 23, // "<CNPC_MidBoss>".to_string(),
                CITEMXP_ENTITY => 24, // "<CItemXP>".to_string(),
                CCITADEL_DESTROYABLE_BUILDING_ENTITY => 25, // "<CCitadel_Destroyable_Building>".to_string(),
                CNPC_BOSS_TIER2_ENTITY => 26, // "<CNPC_Boss_Tier2>".to_string(),
                CNPC_TROOPERBARRACKBOSS_ENTITY => 27, // "<CNPC_TrooperBarrackBoss>".to_string(),
                CNPC_BOSS_TIER3_ENTITY => 28, // "<CNPC_Boss_Tier3>".to_string(),
                CNPC_NEUTRAL_SINNERSSACRIFICE_ENTITY => 29, // "<CNPC_Neutral_SinnersSacrifice>".to_string(),
                CNPC_BASE_DEFENSE_SENTRY_ENTITY => 30, // "<CNPC_BaseDefenseSentry>".to_string(),
                _ => panic!("Unknown entity - Name: {}, Hash: {}", serializer_name.str, serializer_name.hash),
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
        let custom_attacker_id = self.get_custom_player_id(ctx, attacker);
        let custom_victim_id = self.get_custom_player_id(ctx, victim);

        let victims_list = self.damage_window
            .entry(custom_attacker_id)
            .or_insert(HashMap::new());

        let victim_damage = victims_list
            .entry(custom_victim_id)
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

        if next_window != this_window {
            for (_index, entity) in ctx.entities().unwrap().iter() {
                if !self.should_track_position(entity) {
                    continue;
                }
                let position = get_entity_position(entity);
                let custom_id = self.get_custom_player_id(ctx, entity);
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
            self.seconds = this_window;
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
        if delta_header == DeltaHeader::CREATE {
            // ***Do things on entity created ***
        }

        if delta_header == DeltaHeader::UPDATE {
            // ***Do things on entity updated ***
        }

        if delta_header == DeltaHeader::CREATE {
            // ***Do things on entity deleted ***
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

                    // FIXME: Need to change this so we're not sending entity indexes
                    // Also need a system to map entity hashes to string names that we can
                    // save in our backend DB so our frontend can cache/display them properly
                    let record = DamageRecord {
                        damage: msg.damage(),
                        pre_damage: msg.pre_damage(),
                        r#type: msg.r#type(),
                        citadel_type: msg.citadel_type(),
                        // origin: msg.origin.as_ref().map(|v| Vector4 { x: v.x, y: v.y, z: v.z, w: v.w }) ,
                        // entindex_victim: get_custom_player_id(msg.entindex_victim()),
                        entindex_inflictor: msg.entindex_inflictor(),
                        // entindex_attacker: get_custom_player_id(msg.entindex_attacker()),
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