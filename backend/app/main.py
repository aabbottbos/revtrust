from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.routes import analyze, health, ai_analysis, stripe_routes, webhooks

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting RevTrust API...")
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    print(f"📍 ALLOWED_ORIGINS: {allowed_origins_str}")
    yield
    # Shutdown
    print("👋 Shutting down RevTrust API...")

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

# Routes
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(ai_analysis.router, tags=["AI Analysis"])
app.include_router(stripe_routes.router, tags=["Stripe"])
app.include_router(webhooks.router, tags=["Webhooks"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
