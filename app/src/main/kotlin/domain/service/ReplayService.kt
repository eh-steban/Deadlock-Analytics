package domain.service

import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream
import io.github.cdimascio.dotenv.dotenv

class ReplayService() {
    fun getFirstReplay(): String {
        val replayDirPath = dotenv()["REPLAY_FILE_PATH"] ?: throw RuntimeException("REPLAY_FILE_PATH not found in .env")
        val replayDirectory = File(replayDirPath)

        // Check if the directory exists and is valid
        if (!replayDirectory.exists()) {
            throw IllegalStateException("Replay directory does not exist: ${replayDirectory.absolutePath}")
        }
        if (!replayDirectory.isDirectory) {
            throw IllegalStateException("Replay path is not a directory: ${replayDirectory.absolutePath}")
        }

        // Get a list of .dem files in the directory
        val replayFiles = replayDirectory.listFiles { file ->
            file.isFile && file.name.endsWith(".dem.bz2")
        }?.toList() ?: emptyList()

        // Check if there are no files
        if (replayFiles.isEmpty()) {
            throw IllegalStateException("No replay files found in directory: ${replayDirectory.absolutePath}")
        }

        // Print all replay files (optional)
        replayFiles.forEach { println("Found replay file: ${it.name}") }

        // Get the first replay file
        // *********************************************************
        // FIXME: The code is iteration 1 towards making this work. I need to
        // refactor this into something that makes more sense. I don't like
        // that the method is intended to "get a replay" and we're doing
        // decompress operations in here.
        val firstReplayFile = replayFiles.first()
        val replayFullPath = "${replayDirPath}/${firstReplayFile.name}"
        val newFileName = firstReplayFile.name.removeSuffix(".bz2")
        val outputPath = "${replayDirPath}/${newFileName}"

        return decompressBzip2(replayFullPath, outputPath)
    }

    fun decompressBzip2(filePath: String, outputPath: String): String {
        val inputFile = File(filePath)
        val outputFile = File(outputPath)

        FileInputStream(inputFile).use { input ->
            BZip2CompressorInputStream(input).use { bzipInput ->
                FileOutputStream(outputFile).use { output ->
                    bzipInput.copyTo(output)
                }
            }
        }
        return outputFile.absolutePath
    }

}