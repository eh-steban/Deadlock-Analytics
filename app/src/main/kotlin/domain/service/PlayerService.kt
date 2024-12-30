package domain.service
import application.dto.PlayerMatchHistory
import application.controller.DeadlockAPIController

class PlayerService() {
    suspend fun getMatchHistoryFor(accountId: Long): PlayerMatchHistory {
        return DeadlockAPIController().fetchAccountMatchHistory(accountId)

    }
}