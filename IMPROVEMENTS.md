# RevTrust Startup Script Improvements

## Summary

Updated the startup scripts to automatically handle common issues that can prevent RevTrust from starting, particularly the PostgreSQL stale lock file issue and backend hanging problems.

## What Was Fixed

### Original Problem (2025-12-10)

The `/schedule` page was showing `ERR_CONNECTION_TIMED_OUT` errors because:

1. **PostgreSQL had a stale lock file** (`postmaster.pid`) preventing it from starting
2. **Backend was hung** waiting for database connection during startup
3. Frontend couldn't connect to the non-responsive backend

### Root Cause

When PostgreSQL crashes or is force-killed, it can leave behind a `postmaster.pid` file. On subsequent startup attempts, PostgreSQL sees this file and refuses to start, thinking another instance is already running.

The backend's startup sequence includes syncing scheduled reviews from the database, so if PostgreSQL isn't running, the backend hangs indefinitely waiting for a database connection.

## Improvements Made

### 1. Enhanced `start_revtrust.sh`

#### PostgreSQL Startup (Lines 76-142)
- ✅ **Auto-detects PostgreSQL version** (e.g., postgresql@16, postgresql@14)
- ✅ **Detects stale lock files** automatically
- ✅ **Validates PID** in lock file is actually a postgres process
- ✅ **Removes stale lock files** safely
- ✅ **Waits up to 10 seconds** for PostgreSQL to be ready
- ✅ **Shows helpful error messages** with log file locations

#### Process Cleanup (Lines 203-236)
- ✅ **Kills hung uvicorn processes** even if not listening on port
- ✅ **Detects CLOSED state** connections and cleans them up
- ✅ **Cleans ports 8000 and 3000** before starting

#### Backend Health Check (Lines 235-261)
- ✅ **Uses correct endpoint** (`/api/health` instead of `/health`)
- ✅ **Checks logs after 15 seconds** for early error detection
- ✅ **Shows last 20 log lines** if startup fails
- ✅ **Exits cleanly** with helpful error messages

### 2. Updated `STARTUP_GUIDE.md`

Added comprehensive troubleshooting sections:

#### PostgreSQL Section
- Step-by-step manual fix for stale lock files
- Common issues and their solutions
- Version-specific data directory locations

#### Backend Hanging Section (New)
- Common causes of backend timeouts
- Diagnostic commands
- Complete fix procedures

### 3. New `health_check.sh` Script

Created a quick health check tool:
- ✅ Checks all 5 services (PostgreSQL, Redis, Backend, Frontend, Worker)
- ✅ Color-coded output (green = running, red = not running)
- ✅ Shows access URLs when all services are healthy
- ✅ Exit code 0 if healthy, 1 if any issues

## Usage

### Start All Services
```bash
./start_revtrust.sh
```

The script now handles:
- Stale PostgreSQL lock files automatically
- Hung backend processes
- Port conflicts
- Better error messages with log excerpts

### Check Service Health
```bash
./health_check.sh
```

Quick verification of all services.

### Stop All Services
```bash
./stop_revtrust.sh
```

Clean shutdown of all services.

## Files Modified

1. `start_revtrust.sh` - Enhanced with better error handling
2. `STARTUP_GUIDE.md` - Added troubleshooting sections
3. `health_check.sh` - New health check utility (created)
4. `IMPROVEMENTS.md` - This file (created)

## Testing

Verified fixes work correctly:
- ✅ PostgreSQL with stale lock file → Auto-detected and fixed
- ✅ Hung backend process → Auto-killed and restarted
- ✅ Backend startup → Now waits for successful health check
- ✅ All services → Running and responding correctly

## Benefits

1. **Self-healing**: Automatically fixes common issues
2. **Better diagnostics**: Shows relevant logs when things fail
3. **Faster debugging**: Health check shows status at a glance
4. **Production-ready**: Handles edge cases gracefully
5. **User-friendly**: Clear, color-coded output

## Future Improvements (Optional)

Consider adding:
- [ ] Database backup before migrations
- [ ] Automatic retry on transient failures
- [ ] Service monitoring with auto-restart
- [ ] Slack/email notifications on errors
- [ ] Performance metrics in logs
- [ ] Docker Compose alternative for easier setup

## Notes

- The startup script now uses `brew services restart` instead of `start` for PostgreSQL to ensure clean restarts
- Health checks wait up to 30 seconds for services to start (configurable)
- All scripts are now more resilient to macOS-specific issues (fork safety, launchctl, etc.)
