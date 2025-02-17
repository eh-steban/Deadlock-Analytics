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
import skadistats.clarity.processor.entities.OnEntityPropertyChanged
import skadistats.clarity.event.Initializer
import skadistats.clarity.event.Event
import skadistats.clarity.event.Provides
import skadistats.clarity.event.EventListener
import skadistats.clarity.processor.runner.Context

import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.jvm.isAccessible

@Serializable
data class EntityEventLog(
    val entityName: String,
    val entityIndex: Int,
    val eventType: String,
    val state: Int,
    val objDmg: Int,
    val totalSpawns: Int,
    val totalDeaths: Int,
)

@Serializable
data class PropertyChangeLog(
    val entityName: String,
    val entityIndex: Int,
    val propertyName: String,
    val value: Float
)

@Serializable
data class EntityHealthLog(
    val entityIndex: Int,
    val serial: Int,
    val entityClass: String,
    val entityId: Int?,
    val ownerId: Int?,
    val hierarchyId: Int?,
    val owner: Int?,
    val controller: Int?,
    val defaultController: Int?,
    val deducedLane: Int?,
    val heroID: Int?,
    val nameStringableIndex: Int?,
    val teamNum: Int?,
    val attackerId: Int?,
    val position: Map<String, Float>?,
    val healthChanges: MutableList<Int>
)

@UsesEntities
@Provides(OnEntitySpawned::class, OnEntityDying::class, OnEntityDied::class)
public class EntityEvents (private val fileName: String) {
    private val lifeStatePaths: MutableMap<Int, FieldPath> = mutableMapOf()
    private val currentLifeState: MutableMap<Int, Int> = mutableMapOf()
    private val eventLog: MutableList<EntityEventLog> = mutableListOf()
    private val propertyChangeLog: MutableList<PropertyChangeLog> = mutableListOf()
    private val healthLogs: MutableMap<Pair<Int?, Int?>, EntityHealthLog> = mutableMapOf()

    private val spawnCounts: MutableMap<String, Int> = mutableMapOf()
    private val deathCounts: MutableMap<String, Int> = mutableMapOf()

    private var evSpawned: Event<OnEntitySpawned>? = null
    private var evDying: Event<OnEntityDying>? = null
    private var evDied: Event<OnEntityDied>? = null

    private val json = Json { prettyPrint = true }

    init {
        SimpleRunner(MappedFileSource(fileName)).runWith(this)
    }

    @Initializer(OnEntitySpawned::class)
    fun initOnEntitySpawned(ctx: Context, eventListener: EventListener<OnEntitySpawned>) {
        println("initOnEntitySpawned")
        evSpawned = ctx.createEvent(OnEntitySpawned::class.java, Entity::class.java);
    }

    @Initializer(OnEntityDying::class)
    fun initOnEntityDying(ctx: Context, eventListener: EventListener<OnEntityDying>) {
        println("initOnEntityDying")
        evDying = ctx.createEvent(OnEntityDying::class.java, Entity::class.java);
    }

    @Initializer(OnEntityDied::class)
    fun initOnEntityDied(ctx: Context, eventListener: EventListener<OnEntityDied>) {
        println("initOnEntityDied")
        evDied = ctx.createEvent(OnEntityDied::class.java, Entity::class.java);
    }

    @OnEntityCreated
    fun onCreated(ctx: Context, entity: Entity) {
        clearCachedState(entity)
        ensureFieldsForEntityInitialized(entity)
        val fieldPath = getFieldPathForEntity(entity)
        if (fieldPath != null) {
            processLifeStateChange(entity, fieldPath)
        }
        trackSpawn(entity)
    }

    // TODO: Commenting this out for now, but this could be used later
    // @OnEntityUpdated
    // fun onUpdated(ctx: Context, entity: Entity, fieldPaths: Array<FieldPath>, num: Int) {
    //     val entityName = entity.dtClass.dtName
    //     println("entity: ${entity.dtClass.toString()}")

    //     if(entity.hasProperty("m_iObjectiveDamage")) {
    //         val objectiveDamage = entity.getPropertyForFieldPath<Int>(entity.dtClass.getFieldPathForName("m_iObjectiveDamage"))
    //         // println("OBJDMG: ${objectiveDamage}")
    //         if (objectiveDamage != null && objectiveDamage > 0) {
    //             logObjectiveDamage(entity, objectiveDamage)

    //             // NOTE: The code below gets the entity state and iterates through it to print
    //             // val state = entity.getState()
    //             // val stateIterator = state.fieldPathIterator()

    //             // println("Entity State Dump for ${entityName} (Index: ${entity.index})")
    //             // println("State object: ${state::class.simpleName}")

    //             // while (stateIterator.hasNext()) {
    //             //     val fieldPath = stateIterator.next()
    //             //     val fieldName = entity.dtClass.getNameForFieldPath(fieldPath)
    //             //     val value = entity.getPropertyForFieldPath<Any?>(fieldPath)

    //             //     println("Field: $fieldName | Value: $value")
    //             // }
    //         }
    //     }

    //     val fieldPath = getFieldPathForEntity(entity)
    //     if (fieldPath == null) {
    //         // println("Warning: FieldPath for entity ${entity.dtClass.dtName} is null.")
    //         return
    //     }
    //     for (i in 0 until num) {
    //         if (fieldPaths[i] == fieldPath) {
    //             println("num: ${num}")
    //             println("fieldPath: ${fieldPath}")
    //             println("fieldPaths[i]: ${fieldPaths[i]}")
    //             println("fieldPaths[num-1]: ${fieldPaths[num-1]}")
    //             processLifeStateChange(entity, fieldPath)
    //             break
    //         }
    //     }
    // }

    @OnEntityPropertyChanged
    fun onEntityPropertyChanged(ctx: Context, entity: Entity, fieldPath: FieldPath) {
        val fieldName = entity.dtClass.getNameForFieldPath(fieldPath)

        if (fieldName == "m_iHealth") {
            val entityIndex = entity.index
            val serial = entity.serial
            val entityClass = entity.dtClass.dtName

            val newHealth = entity.getPropertyForFieldPath<Int>(fieldPath)

            val entityId = entity.getPropertyForFieldPathOrNull<Int>("m_nEntityId")
            val ownerId = entity.getPropertyForFieldPathOrNull<Int>("m_nOwnerId")
            val hierarchyId = entity.getPropertyForFieldPathOrNull<Int>("m_nHierarchyId")
            val owner = entity.getPropertyForFieldPathOrNull<Int>("m_hOwner")
            val controller = entity.getPropertyForFieldPathOrNull<Int>("m_hController")
            val defaultController = entity.getPropertyForFieldPathOrNull<Int>("m_hDefaultController")
            val deducedLane = entity.getPropertyForFieldPathOrNull<Int>("m_nDeducedLane")
            val heroID = entity.getPropertyForFieldPathOrNull<Int>("m_nHeroID")
            val nameStringableIndex = entity.getPropertyForFieldPathOrNull<Int>("m_pEntity.m_nameStringableIndex")
            val teamNum = entity.getPropertyForFieldPathOrNull<Int>("m_iTeamNum")
            val attackerId = entity.getPropertyForFieldPathOrNull<Int>("m_hAttacker")

            val position = extractEntityPosition(entity)
            val entityKey = Pair(entityId, ownerId)

            if (entityKey !in healthLogs) {
                healthLogs[entityKey] = EntityHealthLog(
                    entityIndex = entityIndex,
                    serial = serial,
                    entityClass = entityClass,
                    entityId = entityId,
                    ownerId = ownerId,
                    hierarchyId = hierarchyId,
                    owner = owner,
                    controller = controller,
                    defaultController = defaultController,
                    deducedLane = deducedLane,
                    heroID = heroID,
                    nameStringableIndex = nameStringableIndex,
                    teamNum = teamNum,
                    attackerId = attackerId,
                    position = position,
                    healthChanges = mutableListOf<Int>()
                )
            }

            healthLogs[entityKey]?.healthChanges?.add(newHealth)
            saveHealthLogsToJson()
            extractUniqueEntityClasses()
        }
    }

    private fun extractEntityPosition(entity: Entity): Map<String, Float>? {
        return try {
            val x = entity.getPropertyForFieldPathOrNull<Float>("CBodyComponent.m_vecX")
            val y = entity.getPropertyForFieldPathOrNull<Float>("CBodyComponent.m_vecY")
            val z = entity.getPropertyForFieldPathOrNull<Float>("CBodyComponent.m_vecZ")

            if (x != null && y != null && z != null) {
                mapOf("x" to x, "y" to y, "z" to z)
            } else {
                null
            }
        } catch (e: Exception) {
            println("Error retrieving entity position: ${e.message}")
            null
        }
    }

    @OnEntityDeleted
    fun onDeleted(ctx: Context, entity: Entity) {
        trackDeath(entity)
        clearCachedState(entity)
    }

    private fun ensureFieldsForEntityInitialized(entity: Entity) {
        val classId = entity.dtClass.classId
        if (!lifeStatePaths.containsKey(classId)) {
            lifeStatePaths[classId] = entity.dtClass.getFieldPathForName("m_lifeState")
            lifeStatePaths[classId] = entity.dtClass.getFieldPathForName("m_iHealth")
        }
    }

    private fun getFieldPathForEntity(entity: Entity): FieldPath? {
        return lifeStatePaths[entity.dtClass.classId]
    }

    private fun clearCachedState(entity: Entity) {
        currentLifeState.remove(entity.index)
    }

    private fun processLifeStateChange(entity: Entity, fieldPath: FieldPath) {
        val oldState = currentLifeState[entity.index] ?: 2
                val newState: Int = entity.getPropertyForFieldPath(fieldPath)
        if (oldState != newState) {
            currentLifeState[entity.index] = newState
            when (newState) {
                0 -> evSpawned?.raise(entity)
                1 -> evDying?.raise(entity)
                2 -> evDied?.raise(entity)
            }
            logEntityEvent(entity, "StateChanged", newState)
        }
    }

    private fun trackSpawn(entity: Entity) {
        val entityName = entity.dtClass.dtName
        spawnCounts[entityName] = spawnCounts.getOrDefault(entityName, 0) + 1
        logEntityEvent(entity, "Spawned", 0)
    }

    private fun trackDeath(entity: Entity) {
        val entityName = entity.dtClass.dtName
        deathCounts[entityName] = deathCounts.getOrDefault(entityName, 0) + 1
        logEntityEvent(entity, "Died", 2)
    }

    private fun logObjectiveDamage(entity: Entity, damage: Int) {
        val logEntry = EntityEventLog(
            entityName = entity.dtClass.dtName,
            entityIndex = entity.index,
            eventType = "ObjectiveDamage",
            state = 0,
            objDmg = damage,
            totalSpawns = 0,
            totalDeaths = 0,
        )
        eventLog.add(logEntry)
        saveToJson()
    }

    private fun logEntityEvent(entity: Entity, eventType: String, state: Int) {
        val entityName = entity.dtClass.dtName
        val entityIndex = entity.index
        val totalSpawns = spawnCounts[entityName] ?: 0
        val totalDeaths = deathCounts[entityName] ?: 0


        if(entity.hasProperty("m_iObjectiveDamage")) {
            val objectiveDamage = entity.getPropertyForFieldPath<Int>(entity.dtClass.getFieldPathForName("m_iObjectiveDamage"))

            val event = EntityEventLog(
                entityName,
                entityIndex,
                eventType,
                objectiveDamage,
                state,
                totalSpawns,
                totalDeaths,
            )
            eventLog.add(event)
            saveToJson()
        }
    }

    fun extractUniqueEntityClasses() {
        val clarityDataPath = dotenv()["CLARITY_DATA_PATH"] ?: throw RuntimeException("Clarity data path not found in .env")
        val healthFilePath = "$clarityDataPath/health_changes.json"
        val uniqueFilePath = "$clarityDataPath/unique_entity_classes.json"

        val jsonFile = File(healthFilePath)
        if (!jsonFile.exists()) {
            println("❌ Error: health_changes.json not found!")
            return
        }

        try {
            val jsonString = jsonFile.readText()
            val healthLogs: List<EntityHealthLog> = Json.decodeFromString(jsonString)
            val uniqueClasses = healthLogs.map { it.entityClass }.toSet().sorted()
            val uniqueFile = File(uniqueFilePath)
            val outputJson = createJsonString(uniqueClasses)
            uniqueFile.writeText(outputJson)
        } catch (e: Exception) {
            println("❌ Error processing JSON: ${e.message}")
            e.printStackTrace()
        }
    }

    private inline fun <reified T> Entity.getPropertyForFieldPathOrNull(fieldName: String): T? {
        return try {
            val fieldPath = this.dtClass.getFieldPathForName(fieldName)
            this.getPropertyForFieldPath<T>(fieldPath)
        } catch (e: Exception) {
            null
        }
    }

    private fun saveToJson() {
        val clarityDataPath = dotenv()["CLARITY_DATA_PATH"] ?: throw RuntimeException("Clarity data path not found in .env")
        val jsonFilePath = "$clarityDataPath/entity_events.json"
        val jsonFile = File(jsonFilePath)

        jsonFile.parentFile?.mkdirs()

        val jsonString = createJsonString(propertyChangeLog)

        jsonFile.writeText(jsonString)
    }

    private fun saveHealthLogsToJson() {
        val clarityDataPath = dotenv()["CLARITY_DATA_PATH"] ?: throw RuntimeException("Clarity data path not found in .env")
        val jsonFilePath = "$clarityDataPath/health_changes.json"
        val jsonFile = File(jsonFilePath)

        jsonFile.parentFile?.mkdirs()

        try {
            val jsonString = createJsonString(healthLogs.values.toList())
            jsonFile.writeText(jsonString)
        } catch (e: Exception) {
            println("❌ Error writing JSON: ${e.message}")
            e.printStackTrace()
        }
    }

    // NOTE: toLog: Any, the type in this class is 3 different data classes
    private fun createJsonString(toLog: Any): String {
        return json.encodeToString(toLog)
    }

}
