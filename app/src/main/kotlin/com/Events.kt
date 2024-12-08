import skadistats.clarity.model.GameEvent;
import skadistats.clarity.processor.gameevents.OnGameEvent
import skadistats.clarity.processor.runner.ControllableRunner
import skadistats.clarity.source.MappedFileSource

public class Events(private val fileName: String) {

    private val runner: ControllableRunner

    init {
        runner = ControllableRunner(MappedFileSource(fileName)).runWith(this)
        runner.seek(runner.lastTick)
        runner.halt()
    }

    @OnGameEvent
    fun onGameEvent(event: GameEvent) {
        println("Event Name: ${event.name}")
        println("Event Args: ${event.toString()}")
        println("--------------------")
    }
}