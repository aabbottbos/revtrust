# RevTrust Startup Guide

This guide explains how to start and stop all RevTrust services using the provided scripts.

## Services Overview

RevTrust consists of 5 main services:

1. **PostgreSQL** - Database
2. **Redis** - Job queue and caching
3. **Backend API** - FastAPI server (port 8000)
4. **RQ Worker** - Background job processor
5. **Frontend** - Next.js application (port 3000)

## Prerequisites

Before running the startup script, ensure you have:

- [x] PostgreSQL installed (`brew install postgresql`)
- [x] Redis installed (`brew install redis`)
- [x] Poetry installed (for Python dependency management)
- [x] Node.js and npm installed
- [x] Backend `.env` file configured (`backend/.env`)
- [x] Frontend `.env.local` file configured (optional)

## Quick Start

### Start All Services

```bash
./start_revtrust.sh
```

This script will:
1. Check for required dependencies
2. Start PostgreSQL (if not running)
3. Start Redis (if not running)
4. Verify environment files exist
5. Run Prisma database migrations
6. Start the Backend API server
7. Start the RQ Worker for background jobs
8. Start the Frontend development server
9. Tail logs from all services

### Stop All Services

```bash
./stop_revtrust.sh
```

Or press `Ctrl+C` while the startup script is running.

## Accessing Services

Once started, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Redoc Documentation**: http://localhost:8000/redoc

## Logs

All service logs are stored in the `logs/` directory:

- `logs/backend.log` - Backend API logs
- `logs/worker.log` - RQ Worker logs
- `logs/frontend.log` - Frontend logs
- `logs/prisma_migrate.log` - Database migration logs

### View Logs

While services are running:
```bash
# All logs (done automatically by start script)
tail -f logs/*.log

# Just backend
tail -f logs/backend.log

# Just frontend
tail -f logs/frontend.log

# Just worker
tail -f logs/worker.log
```

## Troubleshooting

### Port Already in Use

If you get an error about ports being in use:

```bash
# Kill processes on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill processes on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### PostgreSQL Not Starting

If PostgreSQL fails to start, it might have a stale lock file from a previous crash.

**Automatic Fix** (recommended):
The `start_revtrust.sh` script now automatically detects and fixes stale lock files.

**Manual Fix**:
```bash
# Check PostgreSQL version installed
brew services list | grep postgresql

# If you see an error about "postmaster.pid already exists":
# 1. Find your PostgreSQL data directory
# For postgresql@16: /opt/homebrew/var/postgresql@16
# For postgresql@14: /opt/homebrew/var/postgresql@14

# 2. Check if the PID in the lock file is actually postgres
head -n 1 /opt/homebrew/var/postgresql@16/postmaster.pid

# 3. If that PID is not a postgres process, remove the lock file
rm /opt/homebrew/var/postgresql@16/postmaster.pid

# 4. Restart PostgreSQL
brew services restart postgresql@16

# Check if running
pg_isready
```

**Common Issues**:
- **Lock file error**: Stale `postmaster.pid` file (see above)
- **Port conflict**: Another process using port 5432
- **Permission issues**: Check data directory permissions

### Redis Not Starting

```bash
# Start Redis manually
brew services start redis

# Check if running
redis-cli ping
# Should respond with: PONG
```

### Database Migration Errors

```bash
cd backend
poetry run prisma migrate deploy
```

### Backend Hanging or Timeout Errors

If the backend starts but doesn't respond (connection timeout), it's likely hung during startup.

**Common Causes**:
1. **PostgreSQL not running**: Backend hangs trying to connect to database
2. **Database connection issues**: Wrong DATABASE_URL or network problems
3. **Scheduler sync issues**: Can't sync scheduled reviews from database

**Diagnosis**:
```bash
# Check if backend process is running but not responding
ps aux | grep uvicorn

# Check if PostgreSQL is running
pg_isready

# Test backend health endpoint
curl http://localhost:8000/api/health

# Check backend logs for errors
tail -f logs/backend.log
```

**Fix**:
```bash
# 1. Ensure PostgreSQL is running
brew services restart postgresql@16

# 2. Kill hung backend process
lsof -ti:8000 | xargs kill -9

# 3. Restart using the startup script (handles cleanup automatically)
./start_revtrust.sh
```

### Worker Not Processing Jobs

Check that Redis is running and accessible:
```bash
redis-cli ping
```

Check worker logs:
```bash
tail -f logs/worker.log
```

## Manual Service Management

If you prefer to start services individually:

### Backend
```bash
cd backend
poetry run uvicorn app.main:app --reload
```

### Worker
```bash
cd backend
poetry run python -m app.worker
```

### Frontend
```bash
cd frontend
npm run dev
```

## Environment Variables

### Backend (.env)

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (default: redis://localhost:6379/0)
- `ANTHROPIC_API_KEY` - Claude API key
- `CLERK_SECRET_KEY` - Clerk authentication key
- Other service API keys (Salesforce, HubSpot, Stripe, etc.)

### Frontend (.env.local)

Required variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- Other public configuration

## Additional Commands

### Check Service Status

```bash
# Check if services are running
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Check PostgreSQL
pg_isready

# Check Redis
redis-cli ping
```

### Restart Individual Services

After making code changes:

**Backend** (with auto-reload enabled, just save files)
```bash
# Or manually restart:
lsof -ti:8000 | xargs kill -9
cd backend && poetry run uvicorn app.main:app --reload &
```

**Frontend** (with hot reload, just save files)
```bash
# Or manually restart:
lsof -ti:3000 | xargs kill -9
cd frontend && npm run dev &
```

**Worker** (requires manual restart)
```bash
# Find and kill worker process
ps aux | grep "app.worker"
kill <PID>

# Restart
cd backend && poetry run python -m app.worker &
```

## Development Workflow

1. Start all services: `./start_revtrust.sh`
2. Make code changes
3. Backend and Frontend will auto-reload
4. For worker changes, restart manually
5. Check logs in `logs/` directory
6. Stop services: Press `Ctrl+C` or run `./stop_revtrust.sh`

## Production Deployment

These scripts are for **local development only**. For production:

- Backend: Deploy to Railway or similar
- Frontend: Deploy to Vercel or similar
- Use managed PostgreSQL and Redis services
- See `DEPLOYMENT.md` for full production setup
