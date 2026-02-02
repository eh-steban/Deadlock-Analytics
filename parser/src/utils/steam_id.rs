//! Steam ID conversion utilities

use haste::entities::{ehandle_to_index, Entity, EntityContainer};

use crate::entities::constants::{CONTROLLER_HANDLE_KEY, STEAM_ID_KEY};

/// Convert Steam ID 64 to Steam Account ID (32-bit)
pub fn steamid64_to_accountid(steamid64: Option<u64>) -> u32 {
    match steamid64 {
        Some(id) => (id - 76561197960265728) as u32,
        _ => 0,
    }
}

/// Get Steam ID 32 from an entity
pub fn get_steam_id32(entity: &Entity) -> Option<u32> {
    let steamid64 = entity.get_value::<u64>(&STEAM_ID_KEY);
    Some(steamid64_to_accountid(steamid64))
}

/// Get Steam ID from a player pawn by looking up its controller
pub fn get_steamid_from_pawn(pawn: &Entity, entities: &EntityContainer) -> Option<u64> {
    let controller_handle: u32 = pawn.get_value(&CONTROLLER_HANDLE_KEY)?;
    let controller_index = ehandle_to_index(controller_handle);

    // Get the controller entity
    let player_controller = entities.get(&controller_index)?;

    // Get the steamID from the controller
    player_controller.get_value::<u64>(&STEAM_ID_KEY)
}
