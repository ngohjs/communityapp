from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .api.routes import auth as auth_routes
from .middleware.rate_limit import AuthRateLimitMiddleware
from .database import remove_session

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description=settings.description,
    version=settings.version,
    debug=settings.debug,
)

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuthRateLimitMiddleware)

app.include_router(auth_routes.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Community App API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.on_event("shutdown")
def shutdown_event() -> None:
    """Ensure scoped sessions are cleaned up when application stops."""
    remove_session()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
