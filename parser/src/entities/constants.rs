//! Entity type hash constants for Deadlock replay parsing

use haste::entities::fkey_from_path;
use haste::fxhash;

// =============================================================================
// Entity Type Hashes
// =============================================================================

/// World entity
pub const CWORLD_ENTITY: u64 = fxhash::hash_bytes(b"CWorld");

/// Game rules proxy
pub const DEADLOCK_GAMERULES_ENTITY: u64 = fxhash::hash_bytes(b"CCitadelGameRulesProxy");

// Player entities
pub const CCITADELPLAYERCONTROLLER_ENTITY: u64 = fxhash::hash_bytes(b"CCitadelPlayerController");
pub const CCITADELPLAYERPAWN_ENTITY: u64 = fxhash::hash_bytes(b"CCitadelPlayerPawn");

// NPC entities
pub const CNPC_TROOPER_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_Trooper");
pub const CNPC_TROOPERBOSS_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_TrooperBoss");
pub const CNPC_TROOPERNEUTRAL_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_TrooperNeutral");
pub const CNPC_MIDBOSS_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_MidBoss");

// Objective entities
pub const CITEMXP_ENTITY: u64 = fxhash::hash_bytes(b"CItemXP");
pub const CCITADEL_DESTROYABLE_BUILDING_ENTITY: u64 =
    fxhash::hash_bytes(b"CCitadel_Destroyable_Building");
pub const CNPC_BOSS_TIER2_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_Boss_Tier2");
pub const CNPC_TROOPERBARRACKBOSS_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_TrooperBarrackBoss");
pub const CNPC_BOSS_TIER3_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_Boss_Tier3");

// Neutral entities
pub const CNPC_NEUTRAL_SINNERSSACRIFICE_ENTITY: u64 =
    fxhash::hash_bytes(b"CNPC_Neutral_SinnersSacrifice");

// Defense entities
pub const CNPC_BASE_DEFENSE_SENTRY_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_BaseDefenseSentry");
pub const CNPC_SHIELDEDSENTRY_ENTITY: u64 = fxhash::hash_bytes(b"CNPC_ShieldedSentry");

// =============================================================================
// Field Keys
// =============================================================================

// Player controller fields
pub const OWNER_ENTITY_KEY: u64 = fkey_from_path(&["m_hOwnerEntity"]);
pub const PLAYER_NAME_KEY: u64 = fkey_from_path(&["m_iszPlayerName"]);
pub const STEAM_ID_KEY: u64 = fkey_from_path(&["m_steamID"]);
pub const CONTROLLER_HANDLE_KEY: u64 = fkey_from_path(&["m_hPawn"]);
pub const TEAM_KEY: u64 = fkey_from_path(&["m_iTeamNum"]);
pub const ORIGINAL_LANE_ASSIGNMENT_KEY: u64 = fkey_from_path(&["m_nOriginalLaneAssignment"]);
pub const ASSIGNED_LANE_KEY: u64 = fkey_from_path(&["m_nAssignedLane"]);
pub const LANE_SWAP_LOCKED_KEY: u64 = fkey_from_path(&["m_bLaneSwapLocked"]);
pub const HERO_ID_KEY: u64 = fkey_from_path(&["m_nHeroID"]);
pub const LOBBY_PLAYER_SLOT_KEY: u64 = fkey_from_path(&["m_unLobbyPlayerSlot"]);
pub const ZIPLINE_LANE_COLOR_KEY: u64 = fkey_from_path(&["m_eZipLineLaneColor"]);
