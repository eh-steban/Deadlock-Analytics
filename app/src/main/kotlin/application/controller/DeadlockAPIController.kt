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
import io.github.cdimascio.dotenv.dotenv
import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonArray

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
        val url = "https://data.deadlock-api.com/v2/players/${accountId}/match-history"

        try {
            val response: HttpResponse = client.get(url) {
                header("X-API-Key", apiKey)
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
            println("Error fetching JSON: ${e.message}")
            throw e
        } finally {
            client.close()
        }
    }

    // TODO: I'm setting this up to return a string because I'm printing this to a JSON file
    // I'll likely need to change this behavior to return an actual JSON object so
    // the data is usable in calculations.
    suspend fun fetchMatchMetadata(matchId: Int): String {
        val url = "https://data.deadlock-api.com/v1/matches/${matchId}/metadata"

        try {
            // Fetch content and include apiKey in header
            val response: HttpResponse = client.get(url) {
                header("X-API-Key", apiKey)
            }
            // Convert response body to string, save in .json, and return
            val matchMetadata: String = response.bodyAsText()
            MatchPersistence(matchId).saveToJsonFile(matchMetadata)
            return matchMetadata
        } catch (e: Exception) {
            println("Error fetching JSON: ${e.message}")
            throw e
        } finally {
            client.close()
        }
    }
}
