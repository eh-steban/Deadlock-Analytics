package infrastructure.persistence
import java.io.File

class MatchPersistence(matchId: Long) {
    fun saveToJsonFile(content: String) {
        val outputFilePath = "match_metadata.json"
        val outputFile = File(outputFilePath)

        // Save the JSON response to a file
        outputFile.writeText(content)
        println("JSON data saved to: $outputFilePath")
    }
}