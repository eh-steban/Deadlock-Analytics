// Application related imports
package com
import com.module
import com.ShowScoreboard
import com.Events

// Local server stuff
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import org.slf4j.LoggerFactory

// @JvmStatic
fun main(args: Array<String>) {
    embeddedServer(Netty, port = 8080) {
        module()

        val startTime = System.currentTimeMillis()
        // val fileName = args.getOrNull(0) ?: throw IllegalArgumentException("Replay file is required.")

        // NOTE: These next 2 lines work, but I'm commenting them out so they don't run everytime
        // I start the server. Need to figure out what to do with these.
        // Events(fileName)
        // ShowScoreboard(fileName).showScoreboard()

        val totalTime = System.currentTimeMillis() - startTime
        LoggerFactory.getLogger("com.Main").info("Total time taken: {}s", totalTime / 1000.0)
    }.start(wait = true)
}
