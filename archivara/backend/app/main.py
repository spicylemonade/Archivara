from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
import structlog

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.logging import configure_logging
from app.db.session import engine
from app.db.base_class import Base


# Configure structured logging
configure_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Starting Archivara API", version=settings.APP_VERSION)
    
    # Create database tables
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.warning(f"Database connection failed: {e}. Starting without database.")
        # Continue startup even if database fails
    
    yield
    
    # Shutdown
    logger.info("Shutting down Archivara API")
    await engine.dispose()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Add session middleware (required for OAuth)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.DEBUG else [
        "archivara.org",
        "*.archivara.org",
        "archivara.io",
        "*.archivara.io",
        "localhost",
        "*.railway.app",  # Allow Railway domains
        "*.up.railway.app"  # Allow Railway public domains
    ]
)

# Prometheus metrics (disabled - instrumentator not installed)
# if settings.PROMETHEUS_ENABLED:
#     from prometheus_fastapi_instrumentator import Instrumentator
#     instrumentator = Instrumentator()
#     instrumentator.instrument(app).expose(app)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "service": "archivara-api"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Archivara API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_V1_STR}/docs"
    } 