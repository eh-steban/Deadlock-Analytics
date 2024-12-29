import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.github.cdimascio.dotenv.dotenv
import java.io.File

class DeadlockAPI() {

    private val client = HttpClient(CIO)
    private val dotenv = dotenv()
    private val apiKey = dotenv["API_KEY"] ?: throw RuntimeException("API key not found in .env")

    suspend fun fetchAccountMatchHistory(accountId: Long): String {
        val url = "https://data.deadlock-api.com/v2/players/${accountId}/match-history"

        try {
            // Fetch the content from the URL
            val response: HttpResponse = client.get(url) {
                header("X-API-Key", apiKey) // Add API key if required
            }
            val accountMatchHistory: String = response.bodyAsText()
            val outputFilePath = "match_history.json"
            val outputFile = File(outputFilePath)

            // Save the JSON response to a file
            outputFile.writeText(accountMatchHistory)
            println("JSON data saved to: $outputFilePath")

            return accountMatchHistory
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
            // Fetch the content from the URL
            val response: HttpResponse = client.get(url) {
                header("X-API-Key", apiKey) // Add API key if required
            }
            val matchMetadata: String = response.bodyAsText()
            Match(matchId).save(matchMetadata)
            return matchMetadata
        } catch (e: Exception) {
            println("Error fetching JSON: ${e.message}")
            throw e
        } finally {
            client.close()
        }
    }
}
