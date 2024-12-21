package com

// Local server stuff
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import com.module

// TODO: Since I'm using package com above now, I may be able ot simplify these import statements.
import ShowScoreboard
import Events
import org.slf4j.LoggerFactory

// @JvmStatic
fun main(args: Array<String>) {
    embeddedServer(Netty, port = 8080) {
        module()
    }.start(wait = true)

    val startTime = System.currentTimeMillis()

    // FIXME: Given the code changes to make Webhook.kt work...
    // I need to revisit the below code to make my replay parsing work
    //  init {
    //      showScoreboard = ShowScoreboard(fileName)
    //  }
    // private val showScoreboard: ShowScoreboard
    // Main(args[0]).showScoreboard.showScoreboard()
    // val fileName = args.getOrNull(0) ?: throw IllegalArgumentException("Replay file is required.")
    // Events(fileName)

    val totalTime = System.currentTimeMillis() - startTime
    LoggerFactory.getLogger("com.Main").info("Total time taken: {}s", totalTime / 1000.0)
}
