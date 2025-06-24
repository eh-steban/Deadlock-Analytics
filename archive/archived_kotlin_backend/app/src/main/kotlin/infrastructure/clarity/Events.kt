package infrastructure.clarity

import skadistats.clarity.model.GameEvent;
import skadistats.clarity.model.GameEventDescriptor;
import skadistats.clarity.processor.gameevents.OnGameEvent
import skadistats.clarity.processor.runner.SimpleRunner
import skadistats.clarity.source.MappedFileSource

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.builtins.ListSerializer
import java.io.File
import kotlin.text.split
import kotlin.reflect.full.*
import io.github.cdimascio.dotenv.dotenv

public class Events(private val fileName: String) {
    @Serializable
    data class GameEventData(
        val name: String,
        val id: Int,
        val attributes: Map<String, String> = emptyMap()
    )

    init {
        SimpleRunner(MappedFileSource(fileName)).runWith(this)
    }

    @OnGameEvent
    fun onGameEvent(event: GameEvent) {
        val gameEventData = parseGameEventString(event.toString())
        if (gameEventData != null) {
            appendGameEventToJson(gameEventData)
        }
    }

    fun parseGameEventString(eventString: String): GameEventData? {
        // Regex to extract the content inside the square brackets
        val regex = Regex("""GameEvent \[(.+)]""")
        val matchResult = regex.find(eventString) ?: return null
        val content = matchResult.groupValues[1]

        // Split into key-value pairs
        val keyValuePairs = content.split(", ").mapNotNull {
            val parts = it.split("=")
            if (parts.size == 2) parts[0] to parts[1] else null
        }.toMap()

        // Ensure name and id are present
        val name = keyValuePairs["name"] ?: return null
        val id = keyValuePairs["id"]?.toIntOrNull() ?: return null

        // Remove name and id from attributes
        val attributes = keyValuePairs.filterKeys { it != "name" && it != "id" }

        return GameEventData(name, id, attributes)
    }

    fun appendGameEventToJson(gameEvent: GameEventData) {
        val clarityDataPath = dotenv()["CLARITY_DATA_PATH"] ?: throw RuntimeException("Clarity data path not found in .env")
        val filePath = "$clarityDataPath/game_events.json"
        val file = File(filePath)
        val json = Json { prettyPrint = true }
        val existingEvents: MutableList<GameEventData> = if (file.exists()) {
            file.readText().let { text ->
                if (text.isNotBlank()) {
                    Json.decodeFromString<List<GameEventData>>(text).toMutableList()
                } else {
                    mutableListOf<GameEventData>()
                }
            }
        } else {
            mutableListOf()
        }

        // Add the new event
        existingEvents.add(gameEvent)

        // Write back to file
        file.writeText(json.encodeToString(existingEvents))
    }

    fun inspectMethodsAndProperties(gameEvent: Any) {
        println("Inspecting ${gameEvent::class.simpleName}...")
        // List all methods
        println("Methods:")
        gameEvent::class.functions.forEach { function ->
            println("- ${function.name}")
        }

        // List all properties
        println("\nProperties:")
        gameEvent::class.memberProperties.forEach { property ->
            println("- ${property.name}")
        }

        // List all member functions
        println("\nMember Functions:")
        gameEvent::class.declaredFunctions.forEach { function ->
            println("- ${function.name}")
        }

        // List all member properties (declared)
        println("\nDeclared Properties:")
        gameEvent::class.declaredMemberProperties.forEach { property ->
            println("- ${property.name}")
        }
    }
}