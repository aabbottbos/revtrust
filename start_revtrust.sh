#!/bin/bash

# RevTrust Startup Script
# Starts all services: PostgreSQL, Redis, Backend API, RQ Worker, and Frontend

set -e  # Exit on error

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Log file for services
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}           RevTrust Service Startup Script              ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service_name is running on port $port"
        return 0
    else
        echo -e "${YELLOW}○${NC} $service_name is not running on port $port"
        return 1
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required commands
echo -e "${BLUE}[1/7]${NC} Checking required dependencies..."

if ! command_exists "psql"; then
    echo -e "${RED}✗ PostgreSQL client (psql) not found. Please install PostgreSQL.${NC}"
    exit 1
fi

if ! command_exists "redis-cli"; then
    echo -e "${RED}✗ Redis client (redis-cli) not found. Please install Redis.${NC}"
    echo -e "${YELLOW}  Install with: brew install redis${NC}"
    exit 1
fi

if ! command_exists "poetry"; then
    echo -e "${RED}✗ Poetry not found. Please install Poetry.${NC}"
    echo -e "${YELLOW}  Install with: curl -sSL https://install.python-poetry.org | python3 -${NC}"
    exit 1
fi

if ! command_exists "node"; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required dependencies are installed${NC}"
echo ""

# Check and start PostgreSQL
echo -e "${BLUE}[2/7]${NC} Starting PostgreSQL..."

# Check if PostgreSQL is running
if pg_isready >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is already running${NC}"
else
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"

    if command_exists "brew"; then
        # Detect installed PostgreSQL version
        PG_VERSION=$(brew services list | grep "^postgresql" | awk '{print $1}' | head -n 1)

        if [ -z "$PG_VERSION" ]; then
            echo -e "${RED}✗ No PostgreSQL installation found${NC}"
            echo -e "${YELLOW}  Install with: brew install postgresql${NC}"
            exit 1
        fi

        echo -e "${YELLOW}Found PostgreSQL: $PG_VERSION${NC}"

        # Check for and fix stale lock file
        if [[ "$PG_VERSION" == postgresql@* ]]; then
            PG_DATA_DIR="/opt/homebrew/var/$PG_VERSION"
        else
            PG_DATA_DIR="/opt/homebrew/var/postgresql"
        fi

        if [ -f "$PG_DATA_DIR/postmaster.pid" ]; then
            # Read the PID from the lock file
            STALE_PID=$(head -n 1 "$PG_DATA_DIR/postmaster.pid" 2>/dev/null)

            if [ -n "$STALE_PID" ]; then
                # Check if this PID is actually a postgres process
                if ! ps -p "$STALE_PID" -o comm= | grep -q postgres 2>/dev/null; then
                    echo -e "${YELLOW}⚠ Found stale lock file (PID $STALE_PID is not postgres). Removing...${NC}"
                    rm -f "$PG_DATA_DIR/postmaster.pid"
                fi
            fi
        fi

        # Start PostgreSQL
        brew services restart "$PG_VERSION" >/dev/null 2>&1
        sleep 3

        # Wait up to 10 seconds for PostgreSQL to be ready
        for i in {1..10}; do
            if pg_isready >/dev/null 2>&1; then
                echo -e "${GREEN}✓ PostgreSQL started successfully${NC}"
                break
            fi

            if [ $i -eq 10 ]; then
                echo -e "${RED}✗ PostgreSQL failed to start${NC}"
                echo -e "${YELLOW}  Check logs: tail -20 $PG_DATA_DIR/../log/$PG_VERSION.log${NC}"
                exit 1
            fi

            sleep 1
        done
    else
        echo -e "${RED}✗ Homebrew not found. Cannot start PostgreSQL automatically${NC}"
        echo -e "${YELLOW}  Please start PostgreSQL manually${NC}"
        exit 1
    fi
fi
echo ""

# Check and start Redis
echo -e "${BLUE}[3/7]${NC} Starting Redis..."

# Disable macOS fork safety warning for Redis
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES

if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is already running${NC}"
else
    echo -e "${YELLOW}Starting Redis...${NC}"

    if command_exists "brew"; then
        brew services start redis 2>/dev/null || true
        sleep 2

        if redis-cli ping >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Redis started successfully${NC}"
        else
            echo -e "${RED}✗ Failed to start Redis${NC}"
            echo -e "${YELLOW}  Please start Redis manually with: brew services start redis${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ Cannot start Redis automatically${NC}"
        echo -e "${YELLOW}  Please start Redis manually${NC}"
        exit 1
    fi
fi
echo ""

# Check environment files
echo -e "${BLUE}[4/7]${NC} Checking environment files..."

if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}✗ Backend .env file not found${NC}"
    echo -e "${YELLOW}  Copy .env.example to .env and configure: cp backend/.env.example backend/.env${NC}"
    exit 1
fi

if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    echo -e "${YELLOW}⚠ Frontend .env.local not found (optional)${NC}"
fi

echo -e "${GREEN}✓ Environment files present${NC}"
echo ""

# Run database migrations
echo -e "${BLUE}[5/7]${NC} Running database migrations..."
cd "$BACKEND_DIR"

if poetry run prisma migrate deploy 2>&1 | tee "$LOG_DIR/prisma_migrate.log"; then
    echo -e "${GREEN}✓ Database migrations completed${NC}"
else
    echo -e "${RED}✗ Database migrations failed${NC}"
    echo -e "${YELLOW}  Check logs at: $LOG_DIR/prisma_migrate.log${NC}"
    exit 1
fi
echo ""

# Kill any existing processes on the ports we need
echo -e "${BLUE}[6/7]${NC} Checking for existing processes..."

# Kill any hung uvicorn processes (even if not listening on port)
HUNG_UVICORN=$(ps aux | grep "[u]vicorn app.main:app" | awk '{print $2}')
if [ -n "$HUNG_UVICORN" ]; then
    echo -e "${YELLOW}⚠ Found hung uvicorn process(es). Killing...${NC}"
    echo "$HUNG_UVICORN" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Check backend port (8000)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 8000 is in use. Killing existing process...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Check for processes in CLOSED state on port 8000
if lsof -Pi :8000 | grep -q "CLOSED"; then
    echo -e "${YELLOW}⚠ Found processes in CLOSED state on port 8000. Cleaning up...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Check frontend port (3000)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port 3000 is in use. Killing existing process...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}✓ Ports are available${NC}"
echo ""

# Start all services
echo -e "${BLUE}[7/7]${NC} Starting RevTrust services..."
echo ""

# Start Backend API
echo -e "${YELLOW}Starting Backend API...${NC}"
cd "$BACKEND_DIR"
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend API started (PID: $BACKEND_PID)${NC}"
echo -e "  Logs: $LOG_DIR/backend.log"

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    # Check if backend is responding
    if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi

    # If taking too long, check logs for errors
    if [ $i -eq 15 ]; then
        if grep -q "FATAL\|ERROR\|Exception" "$LOG_DIR/backend.log" 2>/dev/null; then
            echo -e "${RED}✗ Backend encountered errors during startup${NC}"
            echo -e "${YELLOW}Recent errors:${NC}"
            tail -10 "$LOG_DIR/backend.log" | grep -E "FATAL|ERROR|Exception" || true
            exit 1
        fi
    fi

    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Backend failed to start within 30 seconds${NC}"
        echo -e "${YELLOW}Last 20 lines of backend log:${NC}"
        tail -20 "$LOG_DIR/backend.log" 2>/dev/null || echo "No log file found"
        exit 1
    fi
    sleep 1
done

# Start RQ Worker
echo -e "${YELLOW}Starting RQ Worker...${NC}"
cd "$BACKEND_DIR"
poetry run python -m app.worker > "$LOG_DIR/worker.log" 2>&1 &
WORKER_PID=$!
echo -e "${GREEN}✓ RQ Worker started (PID: $WORKER_PID)${NC}"
echo -e "  Logs: $LOG_DIR/worker.log"

# Start Frontend
echo -e "${YELLOW}Starting Frontend...${NC}"
cd "$FRONTEND_DIR"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "  Logs: $LOG_DIR/frontend.log"

# Wait for frontend to be ready
echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠ Frontend took longer than expected to start${NC}"
        echo -e "${YELLOW}  Check logs: $LOG_DIR/frontend.log${NC}"
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}          RevTrust is now running!                      ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo -e "  Frontend:     ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend API:  ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:     ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}Process IDs:${NC}"
echo -e "  Backend:      ${BACKEND_PID}"
echo -e "  Worker:       ${WORKER_PID}"
echo -e "  Frontend:     ${FRONTEND_PID}"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  Backend:      $LOG_DIR/backend.log"
echo -e "  Worker:       $LOG_DIR/worker.log"
echo -e "  Frontend:     $LOG_DIR/frontend.log"
echo ""
echo -e "${YELLOW}To stop all services, run:${NC}"
echo -e "  kill $BACKEND_PID $WORKER_PID $FRONTEND_PID"
echo ""
echo -e "${YELLOW}Or use Ctrl+C to stop this script, then run:${NC}"
echo -e "  lsof -ti:8000,3000 | xargs kill -9"
echo ""
echo -e "${BLUE}Press Ctrl+C to view logs or stop services...${NC}"
echo ""

# Save PIDs to a file for easy cleanup
echo "$BACKEND_PID" > "$LOG_DIR/backend.pid"
echo "$WORKER_PID" > "$LOG_DIR/worker.pid"
echo "$FRONTEND_PID" > "$LOG_DIR/frontend.pid"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"

    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Backend stopped${NC}"
    fi

    if [ -n "$WORKER_PID" ]; then
        kill $WORKER_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Worker stopped${NC}"
    fi

    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    fi

    # Clean up PID files
    rm -f "$LOG_DIR"/*.pid

    echo -e "${BLUE}Services stopped. Logs preserved in: $LOG_DIR${NC}"
    exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Tail the logs
echo -e "${BLUE}Tailing logs (Ctrl+C to stop):${NC}"
echo ""
tail -f "$LOG_DIR/backend.log" "$LOG_DIR/worker.log" "$LOG_DIR/frontend.log"
