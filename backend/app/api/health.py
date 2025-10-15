from fastapi import APIRouter, Response, status

class HealthCheck:
    def __init__(self):
        self._started = False
        self._ready = False

    def mark_started(self):
        self._started = True

    def mark_ready(self):
        self._ready = True

    def mark_not_ready(self):
        self._ready = False

    @property
    def is_started(self) -> bool:
        return self._started

    @property
    def is_ready(self) -> bool:
        return self._ready and self._started


health = HealthCheck()
health.mark_started()
health.mark_ready()

#app = FastAPI()
#
#@app.on_event("startup")
#async def startup_event():
#    # Add your initialization logic here
#    health.mark_started()
#    health.mark_ready()
#
#@app.on_event("shutdown")
#async def shutdown_event():
#    health.mark_not_ready()

router = APIRouter()

@router.get("/startup")
async def startup_probe(response: Response):
    if not health.is_started:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "started" if health.is_started else "starting"}


@router.get("/ready")
async def readiness_probe(response: Response):
    if not health.is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "ready" if health.is_ready else "not_ready"}


@router.get("/live")
async def liveness_probe(response: Response):
    if not health.is_started:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "alive" if health.is_started else "dead"}
