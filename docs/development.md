# Development Guide

## Prerequisites
- Node.js 18+
- Python 3.11+
- Poetry (Python dependency manager)
- PostgreSQL (Local or Cloud)
- Clerk Account (for Auth)
- Anthropic API Key (for AI Analysis)

## Setup

### 1. Clone & Configure
```bash
git clone <repo_url>
cd revtrust

# Setup Backend Env
cd backend
cp .env.example .env
# Fill in DATABASE_URL, ANTHROPIC_API_KEY, CLERK_SECRET_KEY

# Setup Frontend Env
cd ../frontend
cp .env.example .env.local
# Fill in NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
```

### 2. Install Dependencies
```bash
# Backend
cd backend
poetry install
poetry run prisma generate

# Frontend
cd ../frontend
npm install
```

### 3. Run Locally
You will need two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
poetry run python -m app.main
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## Testing

### Backend Tests (Pytest)
We use `pytest` for backend testing.
```bash
cd backend
poetry run pytest
```

### Code Quality
```bash
# Format code
poetry run black .

# Lint code
poetry run ruff check .
```

## Database Migrations
We use Prisma for database management.

```bash
# Push schema changes to DB
poetry run prisma db push

# Generate Prisma Client
poetry run prisma generate
```

## Contributing
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes
3. Push to the branch
4. Open a Pull Request
