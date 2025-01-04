import domain.service.PlayerService
import domain.service.MatchService
import domain.service.ReplayService
import application.controller.APIClient
import application.controller.DeadlockAPIController
import infrastructure.clarity.ClarityExploration

import org.slf4j.LoggerFactory
import kotlinx.serialization.json.Json
import kotlinx.coroutines.runBlocking
import io.github.cdimascio.dotenv.dotenv

// @JvmStatic
fun main(args: Array<String>) = runBlocking {
    val startTime = System.currentTimeMillis()
    val apiClient = APIClient()

    try {
        // Steam user logs in
        // allows us to pull match history
        // we pull match history given the steamId
        // val steamId = dotenv()["STEAM_ID"].toLong() ?: throw RuntimeException("Steam ID not found in .env")

        // val playerMatchHistory = PlayerService(apiClient).getMatchHistoryFor(steamId)

        // given the history, we download each replay and parse it to ShowScoreboard and/or Events
        // MatchService(apiClient).downloadReplayFor(playerMatchHistory.matchHistory[0].matchId)

        // *********************************************************
        // FIXME: The code is iteration 1 towards making this work. I need to
        // refactor this into something that makes more sense. I don't like
        // that the method is intended to "get a replay" and we're doing
        // decompress operations in here.
        // TODO: The code below should be moved to a separate service or module
        // ShowScoreboard likely needs to be refactored as well given the new direction
        val replayFile = ReplayService().getFirstReplay()
        if (!replayFile.exists()) {
            throw IllegalStateException("Replay file does not exist: ${replayFile.absolutePath}")
        }
        if (!replayFile.isFile) {
            throw IllegalStateException("Replay file path is not a file: ${replayFile.absolutePath}")
        }
        // ShowScoreboard(replayFile.absolutePath).showScoreboard()

        println("replayFile.absolutePath: ${replayFile.absolutePath}")
        // ClarityExploration(replayFile.absolutePath).printClarityEntityData()
        Events(replayFile.absolutePath)
        // saveGameEventsToJson(gameEvents, "game_events.json")
        // for the data we need in calculations

        // NOTE: We'll probably need to store history such as matchId and
        // uId because if we have data for that match already,
        // we shouldn't have to download and parse it again for a different
        // player who was in that same match

        // val matchId = 31067068
        // DeadlockAPIController(apiClient).fetchMatchMetadata(matchId)

        val totalTime = System.currentTimeMillis() - startTime
        LoggerFactory.getLogger("com.Main").info("Total time taken: {}s", totalTime / 1000.0)
    }
    catch(e: Exception) {
        throw e
    } finally {
        apiClient.close()
    }
}
