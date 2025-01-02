package domain.service

import java.io.File
import java.io.IOException
import java.io.FileInputStream
import java.io.FileOutputStream
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream
import io.github.cdimascio.dotenv.dotenv

class ReplayService() {
    // FIXME: It seems like a lot of this code could be moved to a Replay model.
    // This was a first stab at making it work.
    fun getFirstReplay(): File {
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
        // FIXME: This is iteration 1 towards making this work. I need to
        // refactor it into something that makes more sense. I think the method
        // is intended to "get a replay" so we may want to move the
        // decompress operations elsewhere.
        val firstReplayFile = replayFiles.first()

        val replayFullPath = "${replayDirPath}/${firstReplayFile.name}"
        val unzippedReplay = unzipReplay(replayFullPath)
        return unzippedReplay
    }

    fun unzipReplay(replayFullPath: String): File {
        val scriptPath = dotenv()["UNZIP_SCRIPT_PATH"] ?: throw RuntimeException("UNZIP_SCRIPT_PATH not found in .env")
        val processBuilder = ProcessBuilder(scriptPath, replayFullPath)
            .redirectError(ProcessBuilder.Redirect.INHERIT)

        try {
            var unzippedFile = File(replayFullPath.removeSuffix(".bz2"))
            if (unzippedFile.exists()) {
                return unzippedFile
            }
            val process = processBuilder.start()
            val unzippedFilePath = process.inputStream.bufferedReader().readText().trim()
            val exitCode = process.waitFor()
            if (exitCode != 0) {
                throw IOException("Unzip script failed with exit code $exitCode")
            }

            println("Successfully unzipped: $unzippedFilePath")
            unzippedFile = File(unzippedFilePath)
            if (!unzippedFile.exists()) {
                throw IOException("Unzipped file not found: $unzippedFilePath")
            }
            return unzippedFile
        } catch (e: Exception) {
            throw RuntimeException("Error unzipping replay: ${e.message}", e)
        }
    }
}