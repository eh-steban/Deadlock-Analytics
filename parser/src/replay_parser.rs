use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use serde::Serialize;

use anyhow::{Result};
use haste::demofile::DemoFile;
use haste::demostream::CmdHeader;
use haste::entities::{self, ehandle_to_index, DeltaHeader, Entity, EntityContainer};
use haste::parser::{Context, Parser, Visitor};
use haste::stringtables::StringTable;
use haste::valveprotos::deadlock::{CitadelUserMessageIds, CCitadelUserMessageDamage};
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
    id: i32,
    name: String,
    steam_id_32: u32,
}

#[derive(Default, Debug, Serialize)]
struct DamageRecord {
   damage: i32,
   r#type: i32,
   citadel_type: i32,
//   inflictor_name: String,
   ability_id: u32,
   attacker_class: u32,
   victim_class: u32,
//    effectiveness: f32,
}

#[derive(Default, Debug)]
struct MyVisitor {
    damage_window: HashMap<i32, HashMap<i32, Vec<DamageRecord>>>,
    damage_done: Vec<HashMap<i32, HashMap<i32, Vec<DamageRecord>>>>,
    players: Vec<Player>,
    entity_id_to_custom_player_id: HashMap<i32, i32>,
}

const OWNER_ENTITY_KEY: u64 = entities::fkey_from_path(&["m_hOwnerEntity"]);
const PLAYER_NAME_KEY: u64 = entities::fkey_from_path(&["m_iszPlayerName"]);
const STEAM_ID_KEY: u64 = entities::fkey_from_path(&["m_steamID"]);
const CONTROLLER_HANDLE_KEY: u64 = entities::fkey_from_path(&["m_hPawn"]);

fn get_entity_name_legacy<'a>(entity: &'a Entity, entity_names: &'a StringTable) -> Option<&'a str> {
    const NAME_STRINGTABLE_INDEX_KEY: u64 =
        entities::fkey_from_path(&["m_pEntity", "m_nameStringableIndex"]);
    let name_stringtable_index: i32 = entity.get_value(&NAME_STRINGTABLE_INDEX_KEY)?;
    let name_stringtable_item = entity_names.get_item(&name_stringtable_index)?;
    let raw_string = name_stringtable_item.string.as_ref()?;
    std::str::from_utf8(raw_string).ok()
}

fn get_entity_name<'a>(entity_class: u32, entity: &'a Entity, entities: &'a EntityContainer) -> std::string::String {
    // Note: I'm not sure which one is mid boss, maybe the game I was testing with didn't ever attack mid boss
    // entity_class may be one of these:
    // 1 = CCitadelPlayerPawn
    // 4 = CNPC_Trooper
    // 5 = CNPC_TrooperBoss
    // 6 = CNPC_TrooperNeutral (I think these are the jungle camps)
    // 7 = CBaseEntity  (it seems to be an entity that's owned by a human player, like a turret; I'm not sure yet. But would be interesting to print out (<ownerName>s minion))
    // 30 this is sometimes CItemXP, but is it always?
    // 33 CCitadel_Destroyable_Building  (the shrines in each base? EntityNames rebels_t3_generator_yellow, rebels_t3_generator_purple, combine_t3_generator_purple, combine_t3_generator_yellow) 
    // 34 CNPC_Boss_Tier2
    // 35 CNPC_TrooperBarrackBoss
    // 36 CNPC_Boss_Tier3
    match entity_class {
        1 => {
            let owner_entity_index: u32 = entity.get_value::<u32>(&OWNER_ENTITY_KEY).unwrap();
            let owner_entity = entities
                .get(&ehandle_to_index(owner_entity_index))
                .unwrap();

            owner_entity.get_value::<String>(&PLAYER_NAME_KEY).unwrap()
        },
        4 => "<Trooper>".to_string(),
        5 => "<TrooperBoss>".to_string(),
        6 => "<TrooperNeutral>".to_string(),
        7 => "<?PlayerMinion?>".to_string(),
        30 => "<?ExpOrb?>".to_string(),
        33 => "<Destroyable_Building>".to_string(),
        34 => "<Boss_Tier2>".to_string(),
        35 => "<TrooperBarrackBoss>".to_string(),
        36 => "<Boss_Tier3>".to_string(),
        _ => "<ERROR_UNKNOWN_UNIT>".to_string()
    }
}

fn steamid64_to_accountid(steamid64: u64) -> u32 {
    if steamid64 == 0 {
        // println!("SteamID64 is 0, returning 0 as AccountID");
        return 0;
    } else {
        // The formula to convert SteamID64 to AccountID is:
        let id = (steamid64 - 76561197960265728) as u32;
        // println!("Converted SteamID64: {} to AccountID: {}", steamid64, id);
        return id;
    }
}

fn get_steam_id32(entity: &Entity) -> Option<u32> {
    let steamid64 = entity.get_value::<u64>(&STEAM_ID_KEY)?;
    return Some(steamid64_to_accountid(steamid64));
}

fn print_citadel_player_controller_index(entities: &EntityContainer) {
    for (_index, entity) in entities.iter() {
        let serializer_name = &entity.serializer().serializer_name.str;
        if serializer_name.as_ref() == "CCitadelPlayerController" {
            println!("Found CCitadelPlayerController at index: {}", entity.index());
            const STEAM_ID_KEY: u64 = entities::fkey_from_path(&["m_steamID"]);
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

impl MyVisitor {
    pub fn get_game_data_json(&self) -> serde_json::Value {
        serde_json::json!({
            "damage_done": self.damage_done,
            "players": self.players,
            "entity_id_to_custom_player_id": self.entity_id_to_custom_player_id
        })
    }

    fn get_custom_player_id(
        &mut self,
        ctx: &Context,
        entity_class: u32,
        entity: &Entity
    ) -> i32 {
        if entity_class == 1 {
            return *self.entity_id_to_custom_player_id
                .entry(entity.index())
                .or_insert_with(|| {
                    let owner_entity_index: u32 = entity.get_value::<u32>(&OWNER_ENTITY_KEY).unwrap();
                    let owner_entity = ctx.entities().unwrap()
                        .get(&ehandle_to_index(owner_entity_index))
                        .unwrap();

                    self.players.push(Player {
                        id: entity.index() as i32,
                        name: entity.get_value(&PLAYER_NAME_KEY).unwrap_or("<unknown>".to_string()),
                        steam_id_32: get_steam_id32(owner_entity).unwrap_or(0),
                    });

                    self.players.len() as i32 - 1
                });
        } else {
            return match entity_class {
                4 => 20, // "<CNPC_Trooper>".to_string(),
                5 => 21, // "<CNPC_TrooperBoss>".to_string(),
                6 => 22, // "<CNPC_TrooperNeutral>".to_string(),
                7 => 23, // "<CNPC_MidBoss>".to_string(),
                30 => 24, // "<CItemXP>".to_string(),
                33 => 25, // "<CCitadel_Destroyable_Building>".to_string(),
                34 => 26, // "<CNPC_Boss_Tier2>".to_string(),
                35 => 27, // "<CNPC_TrooperBarrackBoss>".to_string(),
                36 => 28, // "<CNPC_Boss_Tier3>".to_string(),
                27 => 29, // *****FIXME: Not sure what entity this is*****
                26 => 30, // *****FIXME: Not sure what entity this is*****
                _ => panic!("Unknown value: {}", entity_class),
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

        let custom_attacker_id = self.get_custom_player_id(ctx, record.attacker_class, attacker);
        let custom_victim_id = self.get_custom_player_id(ctx, record.victim_class, victim);

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
        //println!("on_tick_end \t\t new: {:?} \t interval: {:?}  \t time?: {:?}", ctx.tick(), ctx.tick_interval(), ctx.tick() as f32 * ctx.tick_interval());

        let next_window = (((1 + ctx.tick()) as f32) * ctx.tick_interval()).round() as i32;
        let this_window = ((ctx.tick() as f32) * ctx.tick_interval()).round() as i32;

        if next_window != this_window {
            // restart the current window
            // println!("Damage Window: {:?}", self.damage_window);
            // println!("Players: {:?}", self.players);
            self.damage_done.push(std::mem::replace(&mut self.damage_window, HashMap::new()));
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

        // if delta_header == DeltaHeader::CREATE {
        //     ****Do stuff on entity creation here****
        // }
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

                    let attacker_name = entities
                        .get(&msg.entindex_attacker())
                        .and_then(|entindex| get_entity_name_legacy(entindex, entity_names))
                        .unwrap_or("<some-other-unit>");

                    let attacker = entities
                        .get(&msg.entindex_attacker());

                    let victim = entities
                        .get(&msg.entindex_victim());

                    if attacker.is_none() || victim.is_none() {
                        // println!("Attacker or Victim was None");
                        return Ok(())
                    }

                    if let Err(error) = self.push_damage_record(ctx, attacker.unwrap(), victim.unwrap(), DamageRecord {
                        damage: msg.damage(),
                        r#type: msg.r#type(),
                        citadel_type: msg.citadel_type(),
                        // inflictor_name: todo!(),
                        ability_id: msg.ability_id(),
                        attacker_class: msg.attacker_class(),
                        victim_class: msg.victim_class(),
                        // effectiveness: msg.effectiveness()
                    }) {
                        println!("Failed to push damage record: {:?}", error);
                        return Err(error);
                    };
                // }
            //}
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