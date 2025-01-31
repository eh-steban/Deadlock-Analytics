package infrastructure.clarity

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import kotlin.reflect.full.*
import io.github.cdimascio.dotenv.dotenv
import skadistats.clarity.processor.entities.Entities
import skadistats.clarity.processor.entities.UsesEntities
import skadistats.clarity.model.s2.S2ModifiableFieldPath
import skadistats.clarity.processor.runner.SimpleRunner
import skadistats.clarity.source.MappedFileSource
import skadistats.clarity.model.Entity

import skadistats.clarity.model.FieldPath
import skadistats.clarity.processor.entities.OnEntityCreated
import skadistats.clarity.processor.entities.OnEntityUpdated
import skadistats.clarity.processor.entities.OnEntityDeleted
import skadistats.clarity.event.Initializer
import skadistats.clarity.event.Event
import skadistats.clarity.event.Provides
import skadistats.clarity.event.EventListener
import skadistats.clarity.processor.runner.Context

@Serializable
data class EntityEventLog(
    val entityName: String,
    val entityIndex: Int,
    val eventType: String,
    val state: Int,
    val totalSpawns: Int,
    val totalDeaths: Int
)

@UsesEntities
@Provides(OnEntitySpawned::class, OnEntityDying::class, OnEntityDied::class)
public class EntityEvents (private val fileName: String) {
    private val lifeStatePaths: MutableMap<Int, FieldPath> = mutableMapOf()
    private val currentLifeState: MutableMap<Int, Int> = mutableMapOf()
    private val eventLog: MutableList<EntityEventLog> = mutableListOf()

    private val spawnCounts: MutableMap<String, Int> = mutableMapOf()
    private val deathCounts: MutableMap<String, Int> = mutableMapOf()

    private var evSpawned: Event<OnEntitySpawned>? = null
    private var evDying: Event<OnEntityDying>? = null
    private var evDied: Event<OnEntityDied>? = null

    init {
        val runner = SimpleRunner(MappedFileSource(fileName)).runWith(this)
        saveToJson()
    }

    @Initializer(OnEntitySpawned::class)
    fun initOnEntitySpawned(ctx: Context, eventListener: EventListener<OnEntitySpawned>) {
        evSpawned = ctx.createEvent(OnEntitySpawned::class.java, Entity::class.java);
    }

    @Initializer(OnEntityDying::class)
    fun initOnEntityDying(ctx: Context, eventListener: EventListener<OnEntityDying>) {
        evDying = ctx.createEvent(OnEntityDying::class.java, Entity::class.java);
    }

    @Initializer(OnEntityDied::class)
    fun initOnEntityDied(ctx: Context, eventListener: EventListener<OnEntityDied>) {
        evDied = ctx.createEvent(OnEntityDied::class.java, Entity::class.java);
    }

    @OnEntityCreated
    fun onCreated(ctx: Context, e: Entity) {
        clearCachedState(e)
        ensureFieldPathForEntityInitialized(e)
        val p = getFieldPathForEntity(e)
        if (p != null) {
            processLifeStateChange(e, p)
        }
        trackSpawn(e)
    }

    @OnEntityDeleted
    fun onDeleted(ctx: Context, e: Entity) {
        println("tracking delete")
        trackDeath(e)
        clearCachedState(e)
    }

    @OnEntityUpdated
    fun onUpdated(ctx: Context, e: Entity, fieldPaths: Array<FieldPath>, num: Int) {
        val p = getFieldPathForEntity(e)
        if (p != null) {
            for (i in 0 until num) {
                if (fieldPaths[i] == p) {
                    processLifeStateChange(e, p)
                    break
                }
            }
        }
    }

    private fun ensureFieldPathForEntityInitialized(e: Entity) {
        val cid = e.dtClass.classId
        if (!lifeStatePaths.containsKey(cid)) {
            lifeStatePaths[cid] = e.dtClass.getFieldPathForName("m_lifeState")
        }
    }

    private fun getFieldPathForEntity(e: Entity): FieldPath? {
        return lifeStatePaths[e.dtClass.classId]
    }

    private fun clearCachedState(e: Entity) {
        currentLifeState.remove(e.index)
    }

    private fun processLifeStateChange(e: Entity, p: FieldPath) {
        val oldState = currentLifeState[e.index] ?: 2
        val newState = e.getPropertyForFieldPath(p) as Int
        if (oldState != newState) {
            currentLifeState[e.index] = newState
            when (newState) {
                0 -> evSpawned?.raise(e)
                1 -> evDying?.raise(e)
                2 -> evDied?.raise(e)
            }
            logEntityEvent(e, "StateChanged", newState)
        }
    }

    private fun trackSpawn(e: Entity) {
        val entityName = e.dtClass.dtName ?: "Unknown"
        spawnCounts[entityName] = spawnCounts.getOrDefault(entityName, 0) + 1
        logEntityEvent(e, "Spawned", 0)
    }

    private fun trackDeath(e: Entity) {
        val entityName = e.dtClass.dtName ?: "Unknown"
        deathCounts[entityName] = deathCounts.getOrDefault(entityName, 0) + 1
        logEntityEvent(e, "Died", 2)
    }

    private fun printReport() {
        println("Spawns and Deaths Report:")
        println("Entity handle | Spawns | Deaths")
        println("---------------------------------")
        spawnCounts.keys.union(deathCounts.keys).forEach { handle ->
            val spawns = spawnCounts[handle] ?: 0
            val deaths = deathCounts[handle] ?: 0
            println("$handle | $spawns | $deaths")
        }
    }

    private fun logEntityEvent(e: Entity, eventType: String, state: Int) {
        val entityName = e.dtClass.dtName ?: "Unknown"
        val entityIndex = e.index
        val totalSpawns = spawnCounts[entityName] ?: 0
        val totalDeaths = deathCounts[entityName] ?: 0
        val event = EntityEventLog(entityName, entityIndex, eventType, state, totalSpawns, totalDeaths)
        eventLog.add(event)
        println("Logged event: $event")
    }

    private fun saveToJson() {
        val clarityDataPath = dotenv()["CLARITY_DATA_PATH"] ?: throw RuntimeException("Clarity data path not found in .env")
        val jsonFilePath = "$clarityDataPath/entity_events.json"
        val jsonString = Json { prettyPrint = true }.encodeToString(eventLog)
        File(jsonFilePath).writeText(jsonString)
        println("Entity event log saved to $jsonFilePath")

        printReport()
    }
   
}
