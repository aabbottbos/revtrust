# RevTrust - Sales Pipeline Hygiene Platform

Turn messy pipeline data into accurate forecasts and actionable strategy.

🚀 **[Quick Deploy Guide](./QUICK_DEPLOY.md)** | 📖 **[Full Deployment Docs](./DEPLOYMENT.md)**

## Project Structure

```
/revtrust
├── backend/          # FastAPI backend
│   ├── app/          # Application code
│   ├── config/       # Business rules & field mappings
│   ├── prisma/       # Database schema
│   └── tests/        # Tests
├── frontend/         # Next.js frontend
│   ├── app/          # App routes & pages
│   ├── components/   # React components
│   ├── lib/          # Utilities & state
│   └── types/        # TypeScript types
└── README.md
```

## Features

### Core Functionality
- ✅ CSV/Excel pipeline upload
- ✅ 14 automated business rules
- ✅ Instant health score (0-100)
- ✅ Detailed violation reports
- ✅ Export to CSV
- ✅ Analysis history tracking
- ✅ Deal-level insights

### Technical Features
- ✅ User authentication (Clerk)
- ✅ File processing (CSV/XLSX)
- ✅ Real-time progress tracking
- ✅ Responsive design
- ✅ Error handling
- ✅ Database persistence
- ✅ RESTful API

## Getting Started

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   poetry install
   poetry run prisma generate
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values:
   # - DATABASE_URL
   # - ANTHROPIC_API_KEY
   # - CLERK_SECRET_KEY
   ```

3. **Run the server**
   ```bash
   poetry run python -m app.main
   ```

   Server will start at http://localhost:8000

4. **Test health check**
   ```bash
   curl http://localhost:8000/api/health
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values:
   # - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   # - CLERK_SECRET_KEY
   # - NEXT_PUBLIC_API_URL (default: http://localhost:8000)
   ```

3. **Run the dev server**
   ```bash
   npm run dev
   ```

   App will start at http://localhost:3000

## API Endpoints

### Health Check
```bash
GET /api/health
```

### Analyze Pipeline (stub)
```bash
POST /api/analyze
Content-Type: multipart/form-data
file: <csv or xlsx file>
```

## Database Schema

The Prisma schema includes:
- **User** - User accounts (via Clerk)
- **Analysis** - Analysis sessions
- **Deal** - Pipeline deals/opportunities
- **Violation** - Rule violations
- **BusinessRule** - Rule definitions
- **FieldMapping** - Field mapping config

## Business Rules

Rules are organized into 6 categories:
1. **Data Quality** - Missing required fields, unrealistic values
2. **Sales Hygiene** - Stale deals, past close dates
3. **Forecasting** - Probability/stage mismatches
4. **Progression** - Deals stuck in stages
5. **Engagement** - Missing activity
6. **Compliance** - Approval requirements

See `backend/config/business-rules.yaml` for complete list.

## Field Mappings

Supports 30+ field variations for common CRM fields:
- Deal identification (name, ID)
- Account information
- Financial fields (amount, currency)
- Dates (close, created, last activity)
- Sales process (stage, probability, forecast)
- Ownership and contacts
- Additional context

See `backend/config/field-mappings.yaml` for complete list.

## Tech Stack

### Backend
- FastAPI (Python web framework)
- Prisma (Database ORM)
- Anthropic Claude (AI analysis)
- Pydantic (Data validation)
- Python-Jose (JWT tokens)
- Poetry (Dependency management)

### Frontend
- Next.js 16 (React framework)
- TypeScript
- Clerk (Authentication)
- shadcn/ui (UI components)
- Tailwind CSS (Styling)
- Zustand (State management)
- Recharts (Data visualization)

## Development

### Running Tests
```bash
cd backend
poetry run pytest
```

### Code Formatting
```bash
cd backend
poetry run black .
poetry run ruff check .
```

### Stopping Servers
The servers are currently running in the background. To stop them:
1. Find the process IDs with `ps aux | grep "python -m app.main"`
2. Kill with `kill <pid>`

Or restart your terminal to stop all background processes.

## Environment Variables

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Anthropic API key
- `CLERK_SECRET_KEY` - Clerk secret key for JWT verification
- `ENVIRONMENT` - "development" or "production"
- `DEBUG` - true/false
- `ALLOWED_ORIGINS` - CORS allowed origins

### Frontend (.env.local)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token (optional)

## Troubleshooting

### Prisma Issues
If Prisma fails to generate:
```bash
cd backend
poetry run prisma db push
poetry run prisma generate
```

### Clerk Auth Issues
1. Verify environment variables in `.env.local`
2. Check Clerk dashboard for correct keys
3. Restart dev server

### CORS Errors
1. Verify ALLOWED_ORIGINS in backend/.env
2. Check frontend is on http://localhost:3000
3. Restart backend server

### Port Already in Use
If ports 3000 or 8000 are already in use:
```bash
# Find process using port
lsof -i :3000
lsof -i :8000

# Kill the process
kill -9 <PID>
```
