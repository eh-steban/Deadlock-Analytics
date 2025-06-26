from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from app.api import auth, internal 
# Only need the line below for now. Uncomment the line above
# when we implement internal API endpoints.
from app.api import auth

app = FastAPI()

# Configure CORS to work w/ React frontend
origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    # Keeping these next 2 lines for initial development, can be restricted later
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
# app.include_router(internal.router, prefix="/internal", tags=["Internal"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
