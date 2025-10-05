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

    # Note: Database tables are created via Alembic migrations in start.sh
    # Do not use Base.metadata.create_all as it bypasses migration tracking

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

# Trust Railway proxy headers for HTTPS
from starlette.middleware.trustedhost import TrustedHostMiddleware as _TrustedHostMiddleware
from starlette.datastructures import Headers

@app.middleware("http")
async def trust_railway_proxy(request, call_next):
    """Trust X-Forwarded-Proto header from Railway proxy and log requests for debugging"""
    if "x-forwarded-proto" in request.headers:
        # Update the request scope to reflect the correct scheme
        request.scope["scheme"] = request.headers["x-forwarded-proto"]

    # Enhanced logging for debugging mobile issues
    logger.info(
        "Incoming request",
        method=request.method,
        path=request.url.path,
        user_agent=request.headers.get("user-agent", "unknown"),
        origin=request.headers.get("origin", "none"),
        host=request.headers.get("host", "unknown"),
        referer=request.headers.get("referer", "none"),
        x_forwarded_for=request.headers.get("x-forwarded-for", "none"),
    )

    response = await call_next(request)
    return response

# Configure CORS - allow specific origins in production
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://archivara.org",
    "https://www.archivara.org",
    "https://archivara.io",
    "https://www.archivara.io",
]

# In development, allow all origins
if settings.DEBUG:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose all headers for debugging
)

# Add trusted host middleware - more permissive to avoid blocking mobile
# The Host header check ensures the request is for the correct domain
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Allow all hosts - Railway handles domain routing
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