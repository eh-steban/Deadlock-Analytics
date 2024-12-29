import org.slf4j.LoggerFactory
import kotlinx.coroutines.runBlocking
import io.github.cdimascio.dotenv.dotenv

// @JvmStatic
fun main(args: Array<String>) = runBlocking {
    val startTime = System.currentTimeMillis()

    val matchId = 31067068
    DeadlockAPI().fetchMatchMetadata(matchId)

    val dotenv = dotenv()
    val steamID = dotenv["STEAM_ID"].toLong() ?: throw RuntimeException("Steam ID not found in .env")
    DeadlockAPI().fetchAccountMatchHistory(steamID)

    val fileName = args.getOrNull(0) ?: throw IllegalArgumentException("Replay file is required.")
    // Events(fileName)
    ShowScoreboard(fileName).showScoreboard()

    val totalTime = System.currentTimeMillis() - startTime
    LoggerFactory.getLogger("com.Main").info("Total time taken: {}s", totalTime / 1000.0)
}
