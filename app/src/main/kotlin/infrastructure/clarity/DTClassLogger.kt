package infrastructure.clarity

import skadistats.clarity.processor.runner.ControllableRunner
import skadistats.clarity.model.DTClass
// import skadistats.clarity.processor.sendtables.DTClasses
import skadistats.clarity.processor.sendtables.UsesDTClasses
import skadistats.clarity.processor.sendtables.OnDTClass
import skadistats.clarity.source.MappedFileSource
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import io.github.cdimascio.dotenv.dotenv
import java.io.File

@Serializable
data class DTClass(val index: Int, val key: String)

@UsesDTClasses
class DTClassLogger(private val filePath: String) {
    private val json = Json { prettyPrint = true }
    val clarityDataPath =
        dotenv()["CLARITY_DATA_PATH"]
                ?: throw RuntimeException("Clarity data path not found in .env")

    val jsonFilePath = File("$clarityDataPath/DTClassLogger.json")

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

    @OnDTClass
    fun onDTClass(dtClass: DTClass) {
        println("@OnDTClass: ${dtClass}")
        appendLog(dtClass.getDtName())
    }

    private fun appendLog(dtClassString: String) {
        val existingLogs = if (jsonFilePath.exists()) {
            json.decodeFromString<List<String>>(jsonFilePath.readText())
        } else {
            emptyList()
        }
        val updatedLogs = existingLogs + dtClassString
        jsonFilePath.writeText(json.encodeToString(updatedLogs))
    }
}
