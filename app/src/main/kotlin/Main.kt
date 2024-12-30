import domain.service.PlayerService
import domain.service.MatchService
import application.controller.DeadlockAPIController
import org.slf4j.LoggerFactory
import kotlinx.serialization.json.Json
import kotlinx.coroutines.runBlocking
import io.github.cdimascio.dotenv.dotenv

// @JvmStatic
fun main(args: Array<String>) = runBlocking {
    val startTime = System.currentTimeMillis()

    // Steam user logs in
    // allows us to pull match history
    // we pull match history given the steamId
    val dotenv = dotenv()
    val steamId = dotenv["STEAM_ID"].toLong() ?: throw RuntimeException("Steam ID not found in .env")

    val playerMatchHistory = PlayerService().getMatchHistoryFor(steamId)
    val matchId = playerMatchHistory.matchHistory[0].matchId
    MatchService().downloadReplayFor(matchId)

    // given the history, we download each replay and parse it

    // for the data we need in calculations

    // NOTE: We'll probably need to store history such as matchId and
    // uId because if we have data for that match already,
    // we shouldn't have to download and parse it again

    // val matchId = 31067068
    // DeadlockAPIController().fetchMatchMetadata(matchId)

    val fileName = args.getOrNull(0) ?: throw IllegalArgumentException("Replay file is required.")
    // Events(fileName)
    ShowScoreboard(fileName).showScoreboard()

    val totalTime = System.currentTimeMillis() - startTime
    LoggerFactory.getLogger("com.Main").info("Total time taken: {}s", totalTime / 1000.0)
}
