from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import time
from dotenv import load_dotenv

from app.routes import analyze, health, ai_analysis, stripe_routes, webhooks, feedback, analytics, admin, crm_oauth, scheduled_reviews, output_templates
from app.services.scheduler_service import get_scheduler_service

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting RevTrust API...")
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    print(f"📍 ALLOWED_ORIGINS: {allowed_origins_str}")

    # Start scheduler
    print("⏰ Starting scheduler...")
    scheduler = get_scheduler_service()
    scheduler.start()

    # Sync all scheduled reviews from database
    await scheduler.sync_all_schedules()

    print("✅ Backend ready!")

    yield

    # Shutdown
    print("⏸️ Shutting down...")
    scheduler.stop()
    print("👋 RevTrust API stopped")

app = FastAPI(
    title="RevTrust API",
    description="API for analyzing sales pipeline data",
    version="0.1.0",
    lifespan=lifespan
)

# CORS - Parse origins and strip whitespace
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]
print(f"🌐 Configured CORS origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Performance monitoring middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)

    # Log slow requests (> 2 seconds)
    if process_time > 2.0:
        print(f"⚠️  Slow request: {request.method} {request.url.path} took {process_time:.2f}s")

    # Log very slow requests (> 5 seconds) with more detail
    if process_time > 5.0:
        print(f"🚨 VERY SLOW REQUEST: {request.method} {request.url.path}")
        print(f"   Time: {process_time:.2f}s")
        print(f"   Client: {request.client.host if request.client else 'unknown'}")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
