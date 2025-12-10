#!/bin/bash

# RevTrust Health Check Script
# Quickly verify all services are running

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════╗"
echo "║         RevTrust Services Health Check                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Track overall health
ALL_HEALTHY=true

# Check PostgreSQL
echo -n "PostgreSQL (port 5432)     ... "
if pg_isready >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    ALL_HEALTHY=false
fi

# Check Redis
echo -n "Redis (port 6379)          ... "
if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    ALL_HEALTHY=false
fi

# Check Backend API
echo -n "Backend API (port 8000)    ... "
if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
    ALL_HEALTHY=false
fi

# Check Frontend
echo -n "Frontend (port 3000)       ... "
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
    ALL_HEALTHY=false
fi

# Check RQ Worker
echo -n "RQ Worker                  ... "
if ps aux | grep -q "[p]ython -m app.worker"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    ALL_HEALTHY=false
fi

echo ""
echo "────────────────────────────────────────────────────────"

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}✓ All services are healthy${NC}"
    echo ""
    echo "Access points:"
    echo "  • Frontend:  http://localhost:3000"
    echo "  • API:       http://localhost:8000"
    echo "  • API Docs:  http://localhost:8000/docs"
    exit 0
else
    echo -e "${RED}✗ Some services are not running${NC}"
    echo ""
    echo "To start all services, run:"
    echo "  ./start_revtrust.sh"
    exit 1
fi
