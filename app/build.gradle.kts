// This build file is specific to the backend Kotlin application

plugins {
    kotlin("jvm") version "2.0.21"
    kotlin("plugin.serialization") version "2.0.21"

    // Apply the application plugin to add support for building a CLI application in Java.
    application
}

repositories {
    // Use Maven Central for resolving dependencies.
    mavenCentral()
}

val ktorVersion = "3.0.2"
dependencies {
    // Use the Kotlin JUnit 5 integration.
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")

    // Use the JUnit 5 integration.
    testImplementation("org.junit.jupiter:junit-jupiter-engine:5.9.3")

    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // TODO: Using this in order to serialize the WebhookPayload data class
    // There may be a better implementation
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

    // This dependency is used by the application.
    implementation("com.google.guava:guava:32.1.1-jre")

    // Clarity Library
    implementation("com.skadistats:clarity:3.1.1")

    // TODO: I don't know what these dependencies are tbh.
    // Figure that out when you can xD
    // According to ChatGPT the 2nd two lines are for logging. SLF4J logging.
    implementation(kotlin("stdlib"))
    implementation("org.slf4j:slf4j-api:2.0.9")
    runtimeOnly("ch.qos.logback:logback-classic:1.4.11")

    // Local client/server dependencies
    implementation("io.ktor:ktor-server-core:$ktorVersion")
    implementation("io.ktor:ktor-server-netty:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")
    implementation("io.ktor:ktor-client-core:$ktorVersion")
    implementation("io.ktor:ktor-client-cio:$ktorVersion")

    implementation("io.github.cdimascio:dotenv-kotlin:6.4.1")

}

// Apply a specific Java toolchain to ease working on different environments.
java {
    // Use Java 21 as the toolchain for Java tasks
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

kotlin {
    // Use Java 21 as the toolchain for Kotlin tasks
    jvmToolchain(21)
    sourceSets["main"].kotlin.srcDirs("src/main/kotlin")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        jvmTarget = "21"
    }
}

application {
    // Define the main class for the application.
    mainClass.set("MainKt")
}
