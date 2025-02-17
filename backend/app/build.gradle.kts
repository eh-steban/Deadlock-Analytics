import org.jetbrains.kotlin.gradle.dsl.JvmTarget

// This build file is specific to the backend Kotlin application
plugins {
    kotlin("jvm") version "2.0.21"
    kotlin("plugin.serialization") version "2.0.21"
    id("io.ktor.plugin") version "3.1.0"

    application
}

repositories {
    mavenCentral()
}

val ktorVersion = "3.1.0"
dependencies {
    // Use the Kotlin JUnit 5 integration.
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")

    // Use the JUnit 5 integration.
    testImplementation("org.junit.jupiter:junit-jupiter-engine:5.9.3")

    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // TODO: Using this in order to serialize the WebhookPayload data class
    // There may be a better implementation
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.0")

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
    implementation("io.ktor:ktor-server-core")
    implementation("io.ktor:ktor-server-netty")
    implementation("io.ktor:ktor-server-content-negotiation")
    implementation("io.ktor:ktor-server-call-logging:$ktorVersion")
    implementation("io.ktor:ktor-server-default-headers:$ktorVersion")
    implementation("io.ktor:ktor-server-cors:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json")
    implementation("io.ktor:ktor-client-core")
    implementation("io.ktor:ktor-client-cio")
    implementation("io.ktor:ktor-client-plugins")
    implementation("io.ktor:ktor-http")
    implementation("io.ktor:ktor-utils")

    // Library to unzip files
    implementation("org.apache.commons:commons-compress:1.23.0")

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

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_21) // ✅ Correct way to set JVM target
    }
}

application {
    // Define the main class for the application.
    // mainClass.set("MainKt")
    mainClass.set("com.example.ApplicationKt")
}
