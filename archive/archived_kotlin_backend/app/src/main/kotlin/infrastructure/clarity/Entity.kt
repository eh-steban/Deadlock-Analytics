package infrastructure.clarity

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import kotlin.reflect.full.*
import io.github.cdimascio.dotenv.dotenv
import skadistats.clarity.processor.entities.Entities
import skadistats.clarity.processor.entities.UsesEntities
import skadistats.clarity.io.s2.S2DTClass
import skadistats.clarity.model.s2.S2ModifiableFieldPath
// import skadistats.clarity.processor.runner.ControllableRunner
import skadistats.clarity.processor.runner.SimpleRunner
import skadistats.clarity.source.MappedFileSource
import skadistats.clarity.model.Entity

@Serializable
data class EntityProperty(
    val fieldPath: String,
    val propertyName: String,
    val value: String
)

@Serializable
data class EntityData(
    val entityName: String,
    val properties: List<EntityProperty>
)

@UsesEntities
class Entity (private val fileName: String) {
    private val runner: SimpleRunner

    init {
        runner = SimpleRunner(MappedFileSource(fileName)).runWith(this)
        // runner.seek(runner.lastTick)
        // runner.halt()
    }

    fun printEntityData() {
        // printEntityTypes()
        val entities = getAllEntitiesByName("CNPC_BaseDefenseSentry")
        // val entities = getAllEntitiesByName("CCitadel_Destroyable_Building")
        // val entities = getAllEntitiesByName("CCitadelTeam")
        // entities.forEach { entity ->
        //     println("Entity: ${entity}")
        // }
        val clarityDataPath = dotenv()["CLARITY_DATA_PATH"] ?: throw RuntimeException("Clarity data path not found in .env")
        val filePath = "$clarityDataPath/cnpc_base_defense_sentry.json"
        writeEntitiesToJsonFile(entities, filePath)
    }
    
    fun getEntityByIndex(entityIndex: Int): Entity {
        return runner.context.getProcessor(Entities::class.java)
            .getByIndex(entityIndex)
    }

    fun getEntityByName(entityName: String): Entity {
        return runner.context.getProcessor(Entities::class.java)
            .getByDtName(entityName)
    }

    fun getAllEntitiesByName(entityName: String): List<Entity> {
        val entitiesProcessor = runner.context.getProcessor(Entities::class.java).getAllByDtName(entityName)
        val entitiesList = entitiesProcessor.asSequence().toList()
        return entitiesList
    }

    fun printEntityTypes() {
        val entities = runner.context.getProcessor(Entities::class.java)
        val entityNames = mutableSetOf<String>()
        println("entities: $entities")

        for (idx in 0 until 1000) {
            val entity = entities.getByIndex(idx)
            if (entity != null) {
                entityNames.add(entity.dtClass.dtName)
            }
        }

        println()
        println("Discovered Entity Types:")
        entityNames.forEach { println(it) }
    }

    fun extractEntityProperties(entity: Entity): EntityData {
        val properties = mutableListOf<EntityProperty>()
        val entityState = entity.getState()
    
        for (fieldPath in entityState.fieldPathIterator()) {
            val propertyName = entity.getDtClass().s2().getNameForFieldPath(fieldPath)
            val propertyValue: Any? = entity.getPropertyForFieldPath<Any?>(fieldPath)
            properties.add(EntityProperty(fieldPath.toString(), propertyName, propertyValue.toString()))
        }
    
        return EntityData(
            entityName = entity.dtClass.dtName,
            properties = properties
        )
    }
    
    fun writeEntitiesToJsonFile(entities: List<Entity>, outputFilePath: String) {
        val entityDataList = entities.map { extractEntityProperties(it) }
        val json = Json { prettyPrint = true }
        val jsonContent = json.encodeToString(entityDataList)
    
        File(outputFilePath).writeText(jsonContent)
        println("Entities written to $outputFilePath")
    }
    
    fun inspectMethodsAndProperties(dtClass: Any) {
        println("Inspecting ${dtClass::class.simpleName}...")
    
        // List all methods
        println("Methods:")
        dtClass::class.functions.forEach { function ->
            println("- ${function.name}")
        }
    
        // List all properties
        println("\nProperties:")
        dtClass::class.memberProperties.forEach { property ->
            println("- ${property.name}")
        }
    
        // List all member functions
        println("\nMember Functions:")
        dtClass::class.declaredFunctions.forEach { function ->
            println("- ${function.name}")
        }
    
        // List all member properties (declared)
        println("\nDeclared Properties:")
        dtClass::class.declaredMemberProperties.forEach { property ->
            println("- ${property.name}")
        }
    }    
}
