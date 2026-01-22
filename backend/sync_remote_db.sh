#!/bin/bash

# Database Sync Script
# Pushes local Prisma schema changes to a remote database

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default remote database URL (Railway)
DEFAULT_REMOTE_URL="postgresql://postgres:QfPkHKpLUhtFYeewCuJaYGZuQPJdrQvK@yamanote.proxy.rlwy.net:58586/railway"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Remote Database Sync Script${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if custom URL is provided as argument
if [ -n "$1" ]; then
    REMOTE_DB_URL="$1"
    echo -e "${GREEN}Using provided database URL${NC}"
else
    # Prompt for database URL
    echo -e "${YELLOW}Enter remote database URL${NC}"
    echo -e "${YELLOW}(Press Enter to use default Railway database)${NC}"
    echo ""
    read -p "Remote DB URL: " USER_INPUT

    if [ -z "$USER_INPUT" ]; then
        REMOTE_DB_URL="$DEFAULT_REMOTE_URL"
        echo -e "${GREEN}Using default Railway database${NC}"
    else
        REMOTE_DB_URL="$USER_INPUT"
        echo -e "${GREEN}Using custom database URL${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Testing connection to remote database...${NC}"

# Test connection using psql
if command -v psql &> /dev/null; then
    if psql "$REMOTE_DB_URL" -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✓ Connection successful!${NC}"
    else
        echo -e "${RED}✗ Connection failed. Please check your database URL.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ psql not found, skipping connection test${NC}"
fi

echo ""
echo -e "${BLUE}Pushing schema changes to remote database...${NC}"
echo ""

# Run Prisma DB push with the remote URL
DATABASE_URL="$REMOTE_DB_URL" poetry run prisma db push

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  ✓ Schema sync completed successfully!${NC}"
    echo -e "${GREEN}============================================${NC}"
else
    echo ""
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}  ✗ Schema sync failed${NC}"
    echo -e "${RED}============================================${NC}"
    exit 1
fi
