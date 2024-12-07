import ShowScoreboard
import org.slf4j.LoggerFactory

class Main(private val fileName: String) {

    private val showScoreboard: ShowScoreboard
    private val log = LoggerFactory.getLogger(Main::class.java.packageName)

    init {
        showScoreboard = ShowScoreboard(fileName)
    }

    companion object {
        @JvmStatic
        fun main(args: Array<String>) {
            val startTime = System.currentTimeMillis()
            Main(args[0]).showScoreboard.showScoreboard()
            val totalTime = System.currentTimeMillis() - startTime
            LoggerFactory.getLogger(Main::class.java.packageName).info("Total time taken: {}s", totalTime / 1000.0)
        }
    }
}
