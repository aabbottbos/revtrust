#!/bin/bash

# RevTrust Stop Script
# Stops all RevTrust services

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="$SCRIPT_DIR/logs"

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        Stopping RevTrust Services                      ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Stop services using PID files if they exist
if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    if kill $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Backend stopped (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Backend process not found${NC}"
    fi
    rm -f "$LOG_DIR/backend.pid"
fi

if [ -f "$LOG_DIR/worker.pid" ]; then
    WORKER_PID=$(cat "$LOG_DIR/worker.pid")
    if kill $WORKER_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Worker stopped (PID: $WORKER_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Worker process not found${NC}"
    fi
    rm -f "$LOG_DIR/worker.pid"
fi

if [ -f "$LOG_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
    if kill $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Frontend stopped (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend process not found${NC}"
    fi
    rm -f "$LOG_DIR/frontend.pid"
fi

# Force kill any processes still on the ports
echo ""
echo -e "${YELLOW}Checking for remaining processes on ports...${NC}"

if lsof -ti:8000 >/dev/null 2>&1; then
    echo -e "${YELLOW}Killing remaining processes on port 8000...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
fi

if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}Killing remaining processes on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

# Stop PostgreSQL
echo ""
echo -e "${YELLOW}Stopping PostgreSQL...${NC}"

if command -v brew >/dev/null 2>&1; then
    # Detect installed PostgreSQL version
    PG_VERSION=$(brew services list | grep "^postgresql" | grep started | awk '{print $1}' | head -n 1)

    if [ -n "$PG_VERSION" ]; then
        brew services stop "$PG_VERSION" >/dev/null 2>&1
        echo -e "${GREEN}✓ PostgreSQL stopped${NC}"
    else
        echo -e "${YELLOW}○ PostgreSQL not running via Homebrew${NC}"
    fi
else
    echo -e "${YELLOW}○ Homebrew not found, skipping PostgreSQL stop${NC}"
fi

# Stop Redis
echo ""
echo -e "${YELLOW}Stopping Redis...${NC}"

REDIS_STOPPED=false

if command -v brew >/dev/null 2>&1; then
    if brew services list | grep "^redis" | grep -q started; then
        brew services stop redis >/dev/null 2>&1
        echo -e "${GREEN}✓ Redis stopped (brew service)${NC}"
        REDIS_STOPPED=true
    fi
fi

# Also check for Redis processes not managed by brew
REDIS_PIDS=$(pgrep redis-server 2>/dev/null)
if [ -n "$REDIS_PIDS" ]; then
    echo "$REDIS_PIDS" | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓ Redis stopped (killed processes)${NC}"
    REDIS_STOPPED=true
fi

if [ "$REDIS_STOPPED" = false ]; then
    echo -e "${YELLOW}○ Redis not running${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}          All RevTrust services stopped                ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Logs preserved in: $LOG_DIR${NC}"
echo ""
