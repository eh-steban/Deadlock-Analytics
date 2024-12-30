package application.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// NOTE: We can collect more history data, but we're starting with these fields first
@Serializable
data class MatchData(
    @SerialName("match_id") val matchId: Int,
    @SerialName("start_time") val startTime: Long,
    @SerialName("game_mode") val gameMode: Int,
    @SerialName("match_mode") val matchMode: Int,
    @SerialName("match_result") val matchResult: Int
)
