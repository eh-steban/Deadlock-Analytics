package infrastructure.clarity

import skadistats.clarity.processor.runner.ControllableRunner
import skadistats.clarity.model.StringTable
import skadistats.clarity.source.MappedFileSource
import skadistats.clarity.processor.stringtables.UsesStringTable;
import skadistats.clarity.processor.stringtables.OnStringTableCreated
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import io.github.cdimascio.dotenv.dotenv
import java.io.File

@Serializable
data class StringTableEntry(val index: Int, val key: String)

@UsesStringTable("*")
class StringTableLogger(private val filePath: String) {
    private val json = Json { prettyPrint = true }
    val clarityDataPath =
        dotenv()["CLARITY_DATA_PATH"]
                ?: throw RuntimeException("Clarity data path not found in .env")

    val jsonFilePath = File("$clarityDataPath/StringTableLogger.json")

    init {
        val runner = ControllableRunner(MappedFileSource(filePath))

        if (!jsonFilePath.exists()) {
            jsonFilePath.writeText("[]")
        }

        try {
            runner.runWith(this)
            runner.seek(runner.lastTick)
        } catch (e: Exception) {
            println("Error processing file: ${e.message}")
            e.printStackTrace()
        } finally {
            runner.halt()
        }
    }

    // The method below requires we accept the tableNum, but we're not
    // doing anything with it yet.
    @OnStringTableCreated
    fun onStringTableCreated(tableNum: Int, stringTable: StringTable) {
        println("String Table Created: ${stringTable.name}")

        // For now, we're only interested in the EntityNames StringTable
        if (stringTable.name == "EntityNames") {
            for (index in 0 until stringTable.getEntryCount()) {
                val logEntry = StringTableEntry(
                    index = index,
                    key = stringTable.getNameByIndex(index),
                )
                appendLog(logEntry)
            }
        }
    }

    private fun appendLog(entry: StringTableEntry) {
        val existingLogs = if (jsonFilePath.exists()) {
            json.decodeFromString<List<StringTableEntry>>(jsonFilePath.readText())
        } else {
            emptyList()
        }
        val updatedLogs = existingLogs + entry
        jsonFilePath.writeText(json.encodeToString(updatedLogs))
    }
}
