from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import os
import time
import traceback
from dotenv import load_dotenv

from app.routes import analyze, health, ai_analysis, stripe_routes, webhooks, feedback, analytics, admin, crm_oauth, scheduled_reviews, output_templates, organizations, forecast, crm_write
from app.services.scheduler_service import get_scheduler_service

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Parse allowed origins at module level
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins_str = allowed_origins_str.strip('"').strip("'")
ALLOWED_ORIGINS = [origin.strip().strip('"').strip("'") for origin in allowed_origins_str.split(",")]
ALLOWED_ORIGINS = [origin.strip().strip('"').strip("'") for origin in allowed_origins_str.split(",")]
logger.info(f"🌐 Raw ALLOWED_ORIGINS env: '{os.getenv('ALLOWED_ORIGINS')}'")
logger.info(f"🌐 Parsed CORS origins: {ALLOWED_ORIGINS}")


class CORSMiddleware(BaseHTTPMiddleware):
    """Custom CORS middleware that handles preflight and adds headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")

        # Handle OPTIONS preflight requests immediately
        if request.method == "OPTIONS":
            logger.debug(f"🔍 OPTIONS preflight: {request.url.path} from origin: {origin}")
            response = Response(
                status_code=200,
                content="",
            )
            # Add CORS headers
            if origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
                response.headers["Access-Control-Allow-Origin"] = origin
            elif ALLOWED_ORIGINS:
                response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0]

            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token"
            response.headers["Access-Control-Max-Age"] = "600"
            response.headers["Access-Control-Expose-Headers"] = "*"
            logger.debug(f"✅ Returning preflight response with origin: {response.headers.get('Access-Control-Allow-Origin')}")
            return response

        # For non-OPTIONS requests, process normally then add CORS headers
        response = await call_next(request)

        # Add CORS headers to all responses
        if origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
        elif ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0]

        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Expose-Headers"] = "*"

        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting RevTrust API...")
    logger.info(f"📍 ALLOWED_ORIGINS: {ALLOWED_ORIGINS}")

    # Start scheduler
    logger.info("⏰ Starting scheduler...")
    scheduler = get_scheduler_service()
    scheduler.start()

    # Sync all scheduled reviews from database
    await scheduler.sync_all_schedules()

    logger.info("✅ Backend ready!")

    yield

    # Shutdown
    logger.info("⏸️ Shutting down...")
    scheduler.stop()
    logger.info("👋 RevTrust API stopped")

app = FastAPI(
    title="RevTrust API",
    description="API for analyzing sales pipeline data",
    version="0.1.0",
    lifespan=lifespan
)

# Add our custom CORS middleware
app.add_middleware(CORSMiddleware)


def add_cors_headers(response: Response, origin: str):
    """Helper to add CORS headers to a response"""
    if origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
    elif ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0]
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Expose-Headers"] = "*"


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with CORS headers"""
    origin = request.headers.get("origin", "")
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    add_cors_headers(response, origin)
    return response


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions with CORS headers"""
    origin = request.headers.get("origin", "")
    """Handle all other exceptions with CORS headers"""
    origin = request.headers.get("origin", "")
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
    add_cors_headers(response, origin)
    return response


# Performance monitoring middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)

    # Log slow requests (> 2 seconds)
    if process_time > 2.0:
        logger.warning(f"⚠️  Slow request: {request.method} {request.url.path} took {process_time:.2f}s")

    # Log very slow requests (> 5 seconds) with more detail
    if process_time > 5.0:
        logger.error(f"🚨 VERY SLOW REQUEST: {request.method} {request.url.path}")
        logger.error(f"   Time: {process_time:.2f}s")
        logger.error(f"   Client: {request.client.host if request.client else 'unknown'}")

    return response

# Routes
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(ai_analysis.router, tags=["AI Analysis"])
app.include_router(stripe_routes.router, tags=["Stripe"])
app.include_router(webhooks.router, tags=["Webhooks"])
app.include_router(feedback.router, tags=["Feedback"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(admin.router, tags=["Admin"])
app.include_router(crm_oauth.router, tags=["CRM OAuth"])
app.include_router(scheduled_reviews.router, tags=["Scheduled Reviews"])
app.include_router(output_templates.router, tags=["Output Templates"])
app.include_router(organizations.router, tags=["Organizations"])
app.include_router(forecast.router, prefix="/api", tags=["Forecast"])
app.include_router(crm_write.router, tags=["CRM Write"])
