package domain.service
import application.dto.PlayerMatchHistory
import application.controller.DeadlockAPIController

import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonObject

class MatchService() {
    suspend fun downloadReplayFor(matchId: Long) {
        // NOTE: This returns a Json object straight from the Deadlock API
        // and they use snakecase.
        val jsonElement = DeadlockAPIController().fetchDemoUrl(matchId)
        val demoUrl = jsonElement.jsonObject["demo_url"]?.toString()?.trim('"') ?: throw Exception("demo_url not found")
        DeadlockAPIController().fetchAndDownloadReplay(demoUrl, matchId)
    }
}