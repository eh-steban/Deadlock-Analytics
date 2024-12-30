package application.controller
import application.dto.PlayerData
import application.dto.MatchData
import application.dto.PlayerMatchHistory
import infrastructure.persistence.MatchPersistence

import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.client.statement.bodyAsChannel
import io.ktor.http.isSuccess
import io.github.cdimascio.dotenv.dotenv
import io.ktor.utils.io.copyAndClose
import io.ktor.util.cio.writeChannel
import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.JsonElement

class DeadlockAPIController() {

    private val client = HttpClient(CIO)
    private val dotenv = dotenv()
    private val apiKey = dotenv["API_KEY"] ?: throw RuntimeException("API key not found in .env")
    private val json = Json {
        ignoreUnknownKeys = true // Ignore extra fields in the JSON
        isLenient = true         // Allow relaxed JSON parsing
        encodeDefaults = true    // Encode default values
    }

    suspend fun fetchAccountMatchHistory(accountId: Long): PlayerMatchHistory {
        val url = "https://data.deadlock-api.com/v2/players/$accountId/match-history"

        try {
            val response: HttpResponse = client.get(url) {
                header("X-API-Key", apiKey)
            }
            if (!response.status.isSuccess()) {
                val errorBody = response.bodyAsText()
                throw Exception("Failed to fetch account match history: HTTP ${response.status.value} - $errorBody")
            }
            val accountMatchHistory: String = response.bodyAsText()
            val outputFilePath = "match_history.json"
            val outputFile = File(outputFilePath)

            // Save the JSON response to a file
            outputFile.writeText(accountMatchHistory)
            println("JSON data saved to: $outputFilePath")

            // Parse JSON into a PlayerMatchHistory instance
            val parsedJson = json.parseToJsonElement(accountMatchHistory).jsonObject
            val matchesJsonArray = parsedJson["matches"]?.jsonArray ?: JsonArray(emptyList())

            // Convert the JSON array to a list of MatchSummary (or similar data class)
            val matches: List<MatchData> = matchesJsonArray.map { element ->
                json.decodeFromJsonElement(MatchData.serializer(), element)
            }

            return PlayerMatchHistory(
                player = PlayerData(accountId),
                matchHistory = matches
            )
        } catch (e: Exception) {
            throw e
        } finally {
            client.close()
        }
    }

    // TODO: I'm setting this up to return a string because I'm printing this to a JSON file
    // I'll likely need to change this behavior to return an actual JSON object so
    // the data is usable in calculations.
    suspend fun fetchMatchMetadata(matchId: Long): String {
        val url = "https://data.deadlock-api.com/v1/matches/$matchId/metadata"

        try {
            val response: HttpResponse = client.get(url) {
                header("X-API-Key", apiKey)
            }
            if (!response.status.isSuccess()) {
                val errorBody = response.bodyAsText()
                throw Exception("Failed to fetch Match Metadata: HTTP ${response.status.value} - $errorBody")
            }
            // Convert response body to string, save in .json, and return
            val matchMetadata: String = response.bodyAsText()
            MatchPersistence(matchId).saveToJsonFile(matchMetadata)
            return matchMetadata
        } catch (e: Exception) {
            throw e
        } finally {
            client.close()
        }
    }

    // NOTE: Return value looks like:
    // {"demo_url":"http://replay392.valve.net/1422450/31179571_2059570154.dem.bz2"}
    suspend fun fetchDemoUrl(matchId: Long): JsonElement {
        val url = "https://data.deadlock-api.com/v1/matches/$matchId/demo-url"
        try {
            val response: HttpResponse = client.get(url) {
                header("X-API-Key", apiKey)
            }
            if (!response.status.isSuccess()) {
                val errorBody = response.bodyAsText()
                throw Exception("Failed to fetch demo URL: HTTP ${response.status.value} - $errorBody")
            }
            return Json.parseToJsonElement(response.bodyAsText())
        } catch (e: Exception) {
            throw e
        } finally {
            client.close()
        }
    }

    // NOTE: Fetches the full replay from Valve servers, not the DeadlockAPI
    suspend fun fetchAndDownloadReplay(demoUrl: String, matchId: Long) {
        val replayDirPath = dotenv["REPLAY_FILE_PATH"] ?: throw RuntimeException("REPLAY_FILE_PATH not found in .env")
        try {
            println("Starting download from $demoUrl")
            val response = client.get(demoUrl)
            if (!response.status.isSuccess()) {
                val errorBody = response.bodyAsText()
                throw Exception("Failed to fetchAndDownloadReplay: HTTP ${response.status.value} - $errorBody")
            }
            val outputFilePath = "$replayDirPath/$matchId.dem"
            val outputFile = File(outputFilePath).apply {
                createNewFile()
            }
            response.bodyAsChannel().copyAndClose(outputFile.writeChannel())
            println("Download complete: $outputFilePath")
        } catch (e: Exception) {
            println("Error downloading replay: ${e.message}")
            throw e
        } finally {
            client.close()
        }
    }
}
