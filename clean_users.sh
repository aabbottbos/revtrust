#!/bin/bash

# clean_users.sh
# Script to remove all users and related data from the database for testing
# WARNING: This will delete ALL user data!
#
# Usage:
#   Local:  ./clean_users.sh
#   Remote: ./clean_users.sh -h HOST -u USER -d DATABASE -p PASSWORD [-P PORT]
#
# Options:
#   -h HOST       Database host (default: localhost)
#   -u USER       Database user (default: revtrust_user)
#   -d DATABASE   Database name (default: revtrust)
#   -p PASSWORD   Database password (default: P@ssword)
#   -P PORT       Database port (default: 5432)
#   --help        Show this help message

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default database connection details (can be overridden by env vars or command-line args)
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-revtrust_user}"
DB_NAME="${DB_NAME:-revtrust}"
DB_PASSWORD="${DB_PASSWORD:-P@ssword}"
DB_PORT="${DB_PORT:-5432}"
DATABASE_URL="${DATABASE_URL:-}"

# Function to parse DATABASE_URL
parse_database_url() {
    local url="$1"

    # Extract components from postgresql://user:password@host:port/database
    # Remove postgresql:// prefix
    url="${url#postgresql://}"
    url="${url#postgres://}"

    # Extract user and password
    if [[ $url =~ ^([^:]+):([^@]+)@(.+)$ ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        url="${BASH_REMATCH[3]}"
    elif [[ $url =~ ^([^@]+)@(.+)$ ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        url="${BASH_REMATCH[2]}"
    fi

    # Extract host, port, and database
    if [[ $url =~ ^([^:]+):([^/]+)/(.+)$ ]]; then
        DB_HOST="${BASH_REMATCH[1]}"
        DB_PORT="${BASH_REMATCH[2]}"
        DB_NAME="${BASH_REMATCH[3]}"
    elif [[ $url =~ ^([^/]+)/(.+)$ ]]; then
        DB_HOST="${BASH_REMATCH[1]}"
        DB_NAME="${BASH_REMATCH[2]}"
    fi
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  Local:  ./clean_users.sh"
    echo "  Remote: ./clean_users.sh --url DATABASE_URL"
    echo "  Remote: ./clean_users.sh -h HOST -u USER -d DATABASE -p PASSWORD [-P PORT]"
    echo ""
    echo -e "${BLUE}Options:${NC}"
    echo "  --url URL     Full database URL (postgresql://user:pass@host:port/db)"
    echo "  -h HOST       Database host (default: localhost)"
    echo "  -u USER       Database user (default: revtrust_user)"
    echo "  -d DATABASE   Database name (default: revtrust)"
    echo "  -p PASSWORD   Database password (default: P@ssword)"
    echo "  -P PORT       Database port (default: 5432)"
    echo "  --help        Show this help message"
    echo ""
    echo -e "${BLUE}Environment Variables:${NC}"
    echo "  You can also set connection details via environment variables:"
    echo "  DATABASE_URL  - Full database URL"
    echo "  DB_HOST, DB_USER, DB_NAME, DB_PASSWORD, DB_PORT - Individual components"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  # Clean local database"
    echo "  ./clean_users.sh"
    echo ""
    echo "  # Clean remote database using DATABASE_URL (command-line)"
    echo "  ./clean_users.sh --url 'postgresql://postgres:pass@host:5432/database'"
    echo ""
    echo "  # Clean remote database using DATABASE_URL (environment variable)"
    echo "  DATABASE_URL='postgresql://postgres:pass@host:5432/database' ./clean_users.sh"
    echo ""
    echo "  # Clean Railway remote database (individual flags)"
    echo "  ./clean_users.sh -h yamanote.proxy.rlwy.net -u postgres -d railway -p 'YourPassword' -P 58586"
    echo ""
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            DATABASE_URL="$2"
            shift 2
            ;;
        -h)
            DB_HOST="$2"
            shift 2
            ;;
        -u)
            DB_USER="$2"
            shift 2
            ;;
        -d)
            DB_NAME="$2"
            shift 2
            ;;
        -p)
            DB_PASSWORD="$2"
            shift 2
            ;;
        -P)
            DB_PORT="$2"
            shift 2
            ;;
        --help)
            show_usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# If DATABASE_URL is set, parse it to extract connection details
if [[ -n "$DATABASE_URL" ]]; then
    echo -e "${BLUE}Parsing DATABASE_URL...${NC}"
    parse_database_url "$DATABASE_URL"
fi

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  RevTrust Database Cleanup Script${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Database Connection:${NC}"
echo "  Host:     $DB_HOST"
echo "  Port:     $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
echo ""
echo -e "${RED}WARNING: This will delete ALL users and related data!${NC}"
echo -e "${RED}This includes:${NC}"
echo "  - All users"
echo "  - All user settings"
echo "  - All revenue targets"
echo "  - All products"
echo "  - All analyses and deals"
echo "  - All violations"
echo "  - All CRM connections"
echo ""
read -p "Are you sure you want to continue? (type 'YES' to confirm): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo -e "${GREEN}Aborted. No changes made.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting cleanup...${NC}"
echo ""

# Function to run SQL command
run_sql() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$1"
}

# Test database connection
echo -e "${BLUE}Testing database connection...${NC}"
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to connect to database!${NC}"
    echo "Please check your connection details and try again."
    exit 1
fi
echo -e "${GREEN}✅ Connected successfully${NC}"
echo ""

# Count users before deletion
echo "📊 Counting existing data..."
USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;")
echo "   Users: $USER_COUNT"

ANALYSIS_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM analyses;")
echo "   Analyses: $ANALYSIS_COUNT"

REVENUE_TARGET_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM revenue_targets;")
echo "   Revenue Targets: $REVENUE_TARGET_COUNT"

PRODUCT_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM products;")
echo "   Products: $PRODUCT_COUNT"

echo ""
echo "🗑️  Deleting data (in order of dependencies)..."

# Delete in order to respect foreign key constraints
echo "   1. Deleting Violations..."
run_sql "DELETE FROM violations;" > /dev/null 2>&1

echo "   2. Deleting Deals..."
run_sql "DELETE FROM deals;" > /dev/null 2>&1

echo "   3. Deleting Analyses..."
run_sql "DELETE FROM analyses;" > /dev/null 2>&1

echo "   4. Deleting Products..."
run_sql "DELETE FROM products;" > /dev/null 2>&1

echo "   5. Deleting Revenue Targets..."
run_sql "DELETE FROM revenue_targets;" > /dev/null 2>&1

echo "   6. Deleting CRM Connections..."
run_sql "DELETE FROM crm_connections;" > /dev/null 2>&1

echo "   7. Deleting User Settings..."
run_sql "DELETE FROM user_settings;" > /dev/null 2>&1

echo "   8. Deleting Users..."
run_sql "DELETE FROM users;" > /dev/null 2>&1

echo ""
echo -e "${GREEN}✅ Cleanup completed successfully!${NC}"
echo ""

# Verify cleanup
REMAINING_USERS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;")
echo "📊 Final counts:"
echo "   Users remaining: $REMAINING_USERS"

if [ "$REMAINING_USERS" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Database is now clean and ready for testing!${NC}"
else
    echo ""
    echo -e "${YELLOW}Warning: Some users remain. Check for constraints or errors.${NC}"
fi

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
