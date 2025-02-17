package application.dto

import kotlinx.serialization.Serializable

// FIXME: I won't want to keep/persist steamID, this is temporary
@Serializable
class PlayerData(val steamId: Long)