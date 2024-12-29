package com

import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText

class DeadlockAPI() {

    private val client = HttpClient(CIO)
    private val apiKey = "HEXE-9bb8629c-9d55-4b86-82d1-2cb0e4eee251"

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
