package infrastructure.clarity

import skadistats.clarity.io.Util
import skadistats.clarity.model.EngineId
import skadistats.clarity.model.Entity
import skadistats.clarity.model.FieldPath
import skadistats.clarity.processor.entities.Entities
import skadistats.clarity.processor.entities.UsesEntities
import skadistats.clarity.processor.runner.ControllableRunner
import skadistats.clarity.source.MappedFileSource
import skadistats.clarity.util.TextTable

@UsesEntities
public class ShowScoreboard(private val fileName: String) {
    private val runner: ControllableRunner

    init {
        // FIXME: Need a null handler here
        runner = ControllableRunner(MappedFileSource(fileName)).runWith(this)
        runner.seek(runner.lastTick)
        runner.halt()
    }

    data class PlayerStats(
        val name: String,
        val level: Int,
        val kills: Int,
        val deaths: Int,
        val assists: Int,
        val souls: Int,
        val lastHits: Int,
        val denies: Int,
        val team: Int
    )

    public fun showScoreboard() {
        val playerStats = getPlayerStats()
        printScoreboard(playerStats)
    }

    private fun getPlayerStats(): List<PlayerStats> {
        val players = mutableListOf<PlayerStats>()

        // NOTE: Team nums are actually 2 and 3, but leaving this like this for now so I
        // can see it iterate through the table
        // TeamNum 1 is the spectator
        for (idx in 2 until 14) {
            try {
                val entity = Entity(fileName).getEntityByIndex(idx)
                val stats = PlayerStats(
                    name = entity.getPropertyForFieldPath(entity.dtClass.getFieldPathForName("m_iszPlayerName")),
                    level = entity.getPropertyForFieldPath(entity.dtClass.getFieldPathForName("m_iLevel")),
                    kills = entity.getPropertyForFieldPath(entity.dtClass.getFieldPathForName("m_iPlayerKills")),
                    deaths = entity.getPropertyForFieldPath(entity.dtClass.getFieldPathForName("m_iDeaths")),
                    assists = entity.getPropertyForFieldPath(entity.dtClass.getFieldPathForName("m_iPlayerAssists")),
                    souls = entity.getPropertyForFieldPath(entity.dtClass.getFieldPathForName("m_iGoldNetWorth")),
                    lastHits = entity.getPropertyForFieldPath(entity.dtClass.getFieldPathForName("m_iLastHits")),
                    denies = entity.getPropertyForFieldPath(entity.dtClass.getFieldPathForName("m_iDenies")),
                    team = entity.getPropertyForFieldPath<Int>(entity.dtClass.getFieldPathForName("m_iTeamNum"))
                )
                players.add(stats)
            } catch (e: Exception) {
                // Handle potential resolution errors
                continue
            }
        }

        return players
    }

    fun printScoreboard(players: List<PlayerStats>) {
        val tableBuilder = TextTable.Builder()
            .addColumn("Name", TextTable.Alignment.LEFT)
            .addColumn("Level", TextTable.Alignment.RIGHT)
            .addColumn("K", TextTable.Alignment.RIGHT)
            .addColumn("D", TextTable.Alignment.RIGHT)
            .addColumn("A", TextTable.Alignment.RIGHT)
            .addColumn("Souls", TextTable.Alignment.RIGHT)
            .addColumn("Last Hits", TextTable.Alignment.RIGHT)
            .addColumn("Denies", TextTable.Alignment.RIGHT)
            .build()

        val teams = listOf(2 to "Amber", 3 to "Sapphire")
        for ((teamNum, teamName) in teams) {
            println()
            println("Team $teamName")
            val teamPlayers = players.filter { it.team == teamNum }
            var row = 0
            teamPlayers.forEach { player ->
                tableBuilder.setData(row, 0, player.name)
                tableBuilder.setData(row, 1, player.level)
                tableBuilder.setData(row, 2, player.kills)
                tableBuilder.setData(row, 3, player.deaths)
                tableBuilder.setData(row, 4, player.assists)
                tableBuilder.setData(row, 5, player.souls)
                tableBuilder.setData(row, 6, player.lastHits)
                tableBuilder.setData(row++, 7, player.denies)
            }
            println(tableBuilder)
        }
    }

    private fun getTeamName(team: Int): String {
        return when (team) {
            2 -> "Amber"
            3 -> "Saphire"
            else -> ""
        }
    }
}