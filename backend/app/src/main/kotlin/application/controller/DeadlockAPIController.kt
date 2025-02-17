package application.controller
import application.dto.PlayerData
import application.dto.MatchData
import application.dto.PlayerMatchHistory
import infrastructure.persistence.MatchPersistence

import io.ktor.utils.io.ByteReadChannel
import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.decodeFromJsonElement


class DeadlockAPIController(private val apiClient: APIClient) {

    suspend fun fetchAccountMatchHistory(accountId: Long): PlayerMatchHistory {
        val url = "https://data.deadlock-api.com/v2/players/$accountId/match-history"

        val accountMatchHistory: String = apiClient.get(url, "fetchAccountMatchHistory")
        val outputFilePath = "match_history.json"
        val outputFile = File(outputFilePath)

        // Save the JSON response to a file
        outputFile.writeText(accountMatchHistory)
        println("JSON data saved to: $outputFilePath")

        // Parse JSON into a PlayerMatchHistory instance
        val parsedJson = apiClient.json.parseToJsonElement(accountMatchHistory).jsonObject
        val matchesJsonArray = parsedJson["matches"]?.jsonArray ?: JsonArray(emptyList())

        // Convert the JSON array to a list of MatchSummary (or similar data class)
        val matches: List<MatchData> = matchesJsonArray.map { element ->
            apiClient.json.decodeFromJsonElement<MatchData>(element)
        }

        return PlayerMatchHistory(
            player = PlayerData(accountId),
            matchHistory = matches
        )
    }

    // TODO: I'm setting this up to return a string because I'm printing this to a JSON file
    // I'll likely need to change this behavior to return an actual JSON object so
    // the data is usable in calculations.
    suspend fun fetchMatchMetadata(matchId: Long): String {
        val url = "https://data.deadlock-api.com/v1/matches/$matchId/metadata"
        val matchMetadata: String = apiClient.get(url, "fetchMatchMetadata")
        MatchPersistence(matchId).saveToJsonFile(matchMetadata)
        return matchMetadata
    }

    // NOTE: Return value looks like:
    // {"demo_url":"http://replay392.valve.net/1422450/31179571_2059570154.dem.bz2"}
    suspend fun fetchDemoUrl(matchId: Long): JsonElement {
        val url = "https://data.deadlock-api.com/v1/matches/$matchId/demo-url"
        return Json.parseToJsonElement(apiClient.get(url, "fetchDemoUrl"))
    }

    // NOTE: Fetches the full replay from Valve servers, not the DeadlockAPI
    suspend fun fetchAndDownloadReplay(demoUrl: String, matchId: Long) {
        println("Starting download from $demoUrl")
        val replayFileStream: ByteReadChannel = apiClient.getAndStream(demoUrl, "fetchAndDownloadReplay")
        val outputFilePath = apiClient.downloadFromStream(replayFileStream, matchId)
        println("Download complete: $outputFilePath")
    }

    inline fun <reified T> Json.decode(element: JsonElement): T {
        return decodeFromJsonElement(element)
    }

}
