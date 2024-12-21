package com

import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.routing.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.http.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.Serializable

fun Application.module() {
    @Serializable
    data class WebhookPayload(val key: String)

    log.info("Setting up server...")
    install(ContentNegotiation) {
        json(Json { prettyPrint = true })
    }

    routing {
        // NOTE: Testing a basic get call
        get("/") {
            call.respondText("Server is running!")
        }

        // NOTE: Testing a basic post call
        post("/webhook") {
            val contentType = call.request.contentType()
            // TODO: println returns this pretty output: Received Content-Type: application/json
            // this@module.log.info returns this much longer output:
            // 22:37:18.995 [eventLoopGroupProxy-4-1] INFO  ktor.application - Received Content-Type: application/json
            // I need to figure out which is preferrable and if the verbose output is better
            // can I call it in a nicer way than using `this@module.log.info`
            // this@module.log.info("Received Content-Type: $contentType")
            println("Received Content-Type: $contentType")

            val body = call.receiveText()
            this@module.log.info("Raw body received: $body")

            val payload = Json.decodeFromString<WebhookPayload>(body)

            this@module.log.info("Parsed webhook payload: $payload")
            call.respondText("Webhook received!")
        }
    }
}
