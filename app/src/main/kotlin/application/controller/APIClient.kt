package application.controller

import io.ktor.client.request.header
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.request.get
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.client.statement.bodyAsChannel
import io.ktor.http.isSuccess
import io.ktor.utils.io.ByteReadChannel
import io.ktor.utils.io.copyAndClose
import io.ktor.util.cio.writeChannel
import kotlinx.serialization.json.Json
import io.github.cdimascio.dotenv.dotenv
import java.io.File

class APIClient() {
    private val apiKey = dotenv()["API_KEY"] ?: throw RuntimeException("API key not found in .env")
    private val client = HttpClient(CIO) {
        install(HttpTimeout) {
            requestTimeoutMillis = 300_000 // 5 minutes
            connectTimeoutMillis = 30_000 // 30 seconds
            socketTimeoutMillis = 300_000 // 5 minutes
        }
    }
    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    suspend fun get(url: String, caller: String): String {
        val response = client.get(url) {
            header("X-API-Key", apiKey)
        }
        if (!response.status.isSuccess()) {
            val errorBody = response.bodyAsText()
            throw Exception("Failed #$caller: HTTP ${response.status.value} - $errorBody")
        }
        return response.bodyAsText()
    }

    suspend fun getAndStream(url: String, caller: String): ByteReadChannel {
        val response = client.get(url) {
            header("X-API-Key", apiKey)
        }
        if (!response.status.isSuccess()) {
            val errorBody = response.bodyAsText()
            throw Exception("Failed #$caller: HTTP ${response.status.value} - $errorBody")
        }
        return response.bodyAsChannel()
    }

    suspend fun downloadFromStream(replayFileStream: ByteReadChannel, matchId: Long): String {
        val replayDirPath = dotenv()["REPLAY_FILE_PATH"] ?: throw RuntimeException("REPLAY_FILE_PATH not found in .env")
        val outputFilePath = "$replayDirPath/$matchId.dem"
        val outputFile = File(outputFilePath).apply {
            createNewFile()
        }
        replayFileStream.copyAndClose(outputFile.writeChannel())
        return outputFilePath
    }

    fun close(){
        client.close()
    }
}
