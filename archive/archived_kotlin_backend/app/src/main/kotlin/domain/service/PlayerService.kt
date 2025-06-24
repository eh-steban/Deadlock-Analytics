package domain.service
import application.dto.PlayerMatchHistory
import application.controller.APIClient
import application.controller.DeadlockAPIController

class PlayerService(private val apiClient: APIClient) {
    suspend fun getMatchHistoryFor(accountId: Long): PlayerMatchHistory {
        return DeadlockAPIController(apiClient).fetchAccountMatchHistory(accountId)

    }
}