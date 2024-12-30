package domain.service
import application.dto.PlayerMatchHistory
import application.controller.DeadlockAPIController

class PlayerService() {
    suspend fun getMatchHistoryFor(accountId: Long): PlayerMatchHistory {
        // borrowed from Main, needs to be adjusted, but should be similar
        return DeadlockAPIController().fetchAccountMatchHistory(accountId)

    }
}