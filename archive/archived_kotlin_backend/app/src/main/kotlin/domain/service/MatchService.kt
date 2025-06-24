package domain.service
import application.dto.PlayerMatchHistory
import application.controller.APIClient
import application.controller.DeadlockAPIController

import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonObject

class MatchService(private val apiClient: APIClient) {
    suspend fun downloadReplayFor(matchId: Long) {
        // NOTE: This returns a Json object straight from the Deadlock API
        // and they use snakecase.
        val jsonElement = DeadlockAPIController(apiClient).fetchDemoUrl(matchId)
        val demoUrl = jsonElement.jsonObject["demo_url"]?.toString()?.trim('"') ?: throw Exception("demo_url not found")
        DeadlockAPIController(apiClient).fetchAndDownloadReplay(demoUrl, matchId)
    }
}