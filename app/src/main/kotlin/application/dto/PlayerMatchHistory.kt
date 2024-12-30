package application.dto

import kotlinx.serialization.Serializable

@Serializable
class PlayerMatchHistory(val player: PlayerData, val matchHistory: List<MatchData>)