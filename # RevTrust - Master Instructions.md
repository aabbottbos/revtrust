# RevTrust - Master Instructions

## backend

To run:
poetry run uvicorn app.main:app --reload

To stop:


## frontend

To run:
npm run dev

To stop:


To run:

cd backend
./start_worker.sh

To stop:


**Terminal 1: Redis**
```bash
# If installed via Homebrew
brew services start redis

# Or run directly
redis-server
```

⏺ Here are the commands to properly kill each service:

  Frontend (Next.js on port 3000)

  lsof -ti :3000 | xargs kill -9

  Backend (Uvicorn on port 8000)

  lsof -ti :8000 | xargs kill -9

  Workers (RQ/Redis workers)

  # Find and kill all Python worker processes
  ps aux | grep "rq worker" | grep -v grep | awk '{print $2}' | xargs kill -9

  Kill all at once

  # Frontend + Backend
  lsof -ti :3000,:8000 | xargs kill -9

  # Then workers
  ps aux | grep "rq worker" | grep -v grep | awk '{print $2}' | xargs kill -9

  Graceful shutdown (recommended)

  If they're running in terminal windows, just use Ctrl+C in each terminal - this is cleaner as it allows processes to shutdown gracefully.

  Check what's running

  # Check frontend
  lsof -i :3000

  # Check backend  
  lsof -i :8000

  # Check workers
  ps aux | grep "rq worker" | grep -v grep

  Note: The -9 flag (SIGKILL) forces immediate termination. For a more graceful shutdown, you can use kill without -9 (sends SIGTERM) first, then use -9 if
  processes don't stop.

https://hooks.slack.com/services/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

## Coding Standards

1. **Naming Conventions & Structure**: Maintain the existing component naming conventions and directory structure established in the initial Claude codebase.