# RevTrust - AI-Powered Sales Pipeline Analysis Platform

## Project Overview

### What It Does
RevTrust is a comprehensive SaaS platform that analyzes sales pipeline data to identify hygiene issues, forecast risks, and ensure data quality. It combines AI-powered qualitative analysis (via Anthropic Claude) with a configurable rule-based engine to evaluate deals against 40+ business rules.

### Problem It Solves
Sales teams struggle with:
- Inconsistent data quality in CRMs (Salesforce, HubSpot)
- Stale or abandoned deals cluttering pipelines
- Unrealistic forecasts due to poor sales hygiene
- Manual pipeline reviews that are time-consuming and error-prone
- Lack of proactive deal risk identification

### Primary Functionality
1. **Pipeline Analysis**: Upload CSV/Excel files OR connect directly to Salesforce/HubSpot to scan pipelines
2. **AI-Powered Insights**: Claude Sonnet 4 analyzes each deal for qualitative risks and recommends next actions
3. **Business Rules Engine**: Evaluates 40+ configurable rules across 6 categories (Data Quality, Sales Hygiene, Forecasting, Progression, Engagement, Compliance)
4. **Scheduled Reviews**: Automated cron-based pipeline scans delivered via email/Slack
5. **Team Collaboration**: Multi-tenant organizations with role-based access
6. **Customization**: User and org-specific rule overrides and custom rules
7. **Admin Features**: LLM prompt management, A/B testing, user administration

---

## Tech Stack

### Backend Stack
| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | FastAPI | 0.109.0 | Async Python web framework |
| **Language** | Python | 3.11+ | Backend language |
| **Package Manager** | Poetry | - | Dependency management |
| **Server** | Uvicorn | - | ASGI server |
| **Database** | PostgreSQL | - | Primary relational database |
| **ORM** | Prisma Client Python | 0.11.0 | Type-safe database access |
| **Cache/Queue** | Redis | 7.1.0 | Job queue and caching |
| **AI Provider** | Anthropic Claude | 0.75.0 | AI analysis (Sonnet 4) |
| **Data Processing** | Pandas | 2.1.0 | CSV/Excel manipulation |
| **Data Processing** | OpenPyXL | 3.1.2 | Excel file handling |
| **Authentication** | python-jose | 3.3.0 | JWT handling |
| **Authentication** | PyJWT | 2.10.1 | JWT verification (Clerk) |
| **Encryption** | Cryptography | 46.0.3 | Fernet encryption for tokens |
| **Validation** | email-validator | 2.3.0 | Email validation |
| **CRM Integration** | simple-salesforce | 1.12.9 | Salesforce API client |
| **CRM Integration** | hubspot-api-client | 12.0.0 | HubSpot API client |
| **Background Jobs** | RQ (Redis Queue) | 2.6.1 | Background processing |
| **Scheduling** | APScheduler | 3.11.1 | Cron-based reviews |
| **Timezone** | pytz | 2025.2 | Timezone handling |
| **Email** | Resend | 2.19.0 | Email delivery |
| **Templates** | Jinja2 | 3.1.6 | Email template rendering |
| **Payments** | Stripe | 14.0.1 | Subscription management |
| **Testing** | pytest | 7.4.0 | Testing framework |
| **Code Quality** | black | 23.12.0 | Code formatting |
| **Linting** | ruff | 0.1.0 | Python linting |

### Frontend Stack
| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 16.0.7 | React framework with App Router |
| **UI Library** | React | 19.2.0 | Component-based UI |
| **Language** | TypeScript | 5.x | Type-safe JavaScript |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **UI Components** | Radix UI | - | 30+ headless components |
| **Component Library** | shadcn/ui | - | Pre-built accessible components |
| **Icons** | Lucide React | 0.555.0 | Icon library |
| **Variants** | class-variance-authority | 0.7.1 | Component variant system |
| **Theme** | next-themes | 0.4.6 | Dark mode support |
| **State Management** | Zustand | 5.0.9 | Lightweight state |
| **Authentication** | @clerk/nextjs | 6.35.5 | User auth & management |
| **Charts** | Recharts | 3.5.1 | Data visualization |
| **Date Picker** | React Day Picker | 9.12.0 | Date selection |
| **File Upload** | react-dropzone | 14.3.8 | Drag-and-drop upload |
| **File Storage** | @vercel/blob | 2.0.0 | File storage |
| **Date Utils** | date-fns | 4.1.0 | Date manipulation |
| **Notifications** | Sonner | 2.0.7 | Toast notifications |

### Fonts
- **Inter** (Google Font) - Headings, navigation, metrics, buttons, badges
- **Switzer** (Local font, 400/500/600) - Body text, labels, tables
- **Inter Tight** (Google Font) - Metrics and badges

---

## Project Structure

```
revtrust/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry (24 routers, CORS, middleware)
│   │   ├── auth.py            # Clerk JWT verification, auth dependencies
│   │   ├── routes/            # 24 API route handlers (~7,200 lines total)
│   │   │   ├── analyze.py     # CSV/Excel upload & analysis
│   │   │   ├── scan.py        # Direct CRM scanning
│   │   │   ├── salesforce.py  # Salesforce OAuth & data fetching
│   │   │   ├── hubspot.py     # HubSpot OAuth & data fetching
│   │   │   ├── scheduled_reviews.py  # Scheduled pipeline reviews
│   │   │   ├── dashboard.py   # Dashboard metrics
│   │   │   ├── admin.py       # Admin operations
│   │   │   └── ...            # (21 more route files)
│   │   ├── services/          # Business logic services (19 services)
│   │   │   ├── ai_service.py          # Anthropic Claude integration
│   │   │   ├── salesforce_service.py  # Salesforce OAuth & API
│   │   │   ├── hubspot_service.py     # HubSpot OAuth & API
│   │   │   ├── scheduler_service.py   # APScheduler cron jobs
│   │   │   ├── review_job_service.py  # Background review execution
│   │   │   ├── email_service.py       # Resend email delivery
│   │   │   ├── prompt_service.py      # LLM prompt versioning
│   │   │   ├── encryption_service.py  # Fernet token encryption
│   │   │   ├── forecast_service.py    # Pipeline forecasting
│   │   │   └── ...                    # (10 more services)
│   │   ├── models/            # Pydantic data models
│   │   ├── utils/             # Utility functions
│   │   │   ├── business_rules_engine.py  # Rule evaluation orchestrator
│   │   │   ├── field_mapper.py           # AI-powered CSV header mapping
│   │   │   ├── file_parser.py            # CSV/Excel parsing (Pandas)
│   │   │   ├── rule_evaluator.py         # Individual rule evaluation
│   │   │   ├── rules_loader.py           # YAML rule loading
│   │   │   └── export_generator.py       # PDF/Excel report generation
│   │   └── jobs/              # Background job definitions
│   ├── config/                # Configuration files
│   │   ├── business-rules.yaml      # 40+ business rules (7 categories)
│   │   └── field-mappings.yaml      # Standard field aliases
│   ├── prisma/
│   │   └── schema.prisma      # Database schema (17 models, 742 lines)
│   ├── scripts/               # Utility scripts
│   ├── pyproject.toml         # Python dependencies (Poetry)
│   └── .env.example           # Environment variable template
│
├── frontend/                  # Next.js 16 frontend
│   ├── app/                   # Next.js App Router (~40 page files)
│   │   ├── layout.tsx         # Root layout (Clerk, fonts, theme)
│   │   ├── page.tsx           # Landing page
│   │   ├── (auth)/            # Auth route group
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (platform)/        # Main app route group
│   │   │   ├── dashboard/     # Dashboard page
│   │   │   ├── scan/          # CRM scan interface
│   │   │   ├── upload/        # CSV upload interface
│   │   │   ├── processing/    # Processing status page
│   │   │   ├── results/       # Analysis results viewer
│   │   │   ├── history/       # Past analyses
│   │   │   ├── crm/           # CRM connections
│   │   │   ├── schedule/      # Scheduled reviews
│   │   │   └── settings/      # User settings
│   │   ├── (marketing)/       # Marketing pages
│   │   │   ├── product/
│   │   │   ├── security/
│   │   │   └── why-revtrust/
│   │   └── admin/             # Admin panel
│   │       ├── page.tsx       # Admin dashboard
│   │       ├── api-test/
│   │       ├── database/
│   │       └── users/
│   ├── components/
│   │   ├── ui/                # 30+ Radix UI-based components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   └── [features]/        # Feature-specific components
│   ├── hooks/                 # Custom React hooks (10 hooks)
│   │   ├── useAdminPrompts.ts     # Prompt management (20KB)
│   │   ├── useOrganization.ts     # Team management (16KB)
│   │   ├── useRules.ts            # Business rules CRUD (15KB)
│   │   ├── useDealReview.ts       # Deal analysis
│   │   ├── useForecast.ts         # Forecasting features
│   │   ├── useSubscription.ts     # Stripe integration
│   │   └── useAuthenticatedFetch.ts  # API client wrapper
│   ├── lib/
│   │   ├── store.ts           # Zustand state management
│   │   └── utils.ts           # Utility functions
│   ├── package.json           # Node dependencies
│   ├── next.config.ts         # Next.js configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── components.json        # shadcn/ui configuration
│   └── .env.local             # Frontend environment variables
│
├── docs/                      # Documentation
├── logs/                      # Runtime logs
├── start_revtrust.sh          # Startup script (PostgreSQL, Redis, Backend, Worker, Frontend)
├── stop_revtrust.sh           # Graceful shutdown script
└── health_check.sh            # Service health monitoring
```

### Key Directory Explanations

**`/backend/app/routes/`** - Contains 24 API endpoint handlers organized by feature area. Each route file handles HTTP requests, validates inputs via Pydantic, and delegates to services.

**`/backend/app/services/`** - Business logic layer. Services encapsulate core functionality (CRM integration, AI analysis, email delivery, etc.) and are imported by routes.

**`/backend/app/utils/`** - Shared utilities including the business rules engine, field mapping, file parsing, and report generation.

**`/backend/config/`** - YAML-based configuration files for business rules and field mappings. These are loaded at runtime and can be overridden per user/org.

**`/backend/prisma/`** - Prisma schema defining 17 database models. Run `prisma generate` after schema changes.

**`/frontend/app/`** - Next.js 16 App Router pages. Route groups `(auth)`, `(platform)`, `(marketing)` organize pages without affecting URL structure.

**`/frontend/components/ui/`** - shadcn/ui components built on Radix UI primitives. These are copy-paste components, fully customizable with Tailwind.

**`/frontend/hooks/`** - Custom React hooks for data fetching, state management, and API interactions. All hooks use `useAuthenticatedFetch` for authenticated requests.

---

## Key Architecture Decisions

### 1. Monorepo with Separate Deployments
**Decision:** Single repository with separate `/backend` and `/frontend` directories.

**Rationale:**
- Coordinated development and versioning
- Shared documentation and configuration
- Separate deployment flexibility (backend can scale independently)
- Clear separation of concerns between Python and TypeScript

### 2. Background Processing with Redis Queue
**Decision:** Use RQ (Redis Queue) for heavy analysis jobs instead of synchronous processing.

**Rationale:**
- File analysis can take 30+ seconds for large pipelines
- Non-blocking API responses improve UX
- Retry logic for transient failures
- Horizontal scaling via multiple workers

**Implementation:**
- `/backend/app/jobs/` defines job functions
- Routes enqueue jobs and return job IDs
- Frontend polls `/api/analyze/{id}/status` for progress
- Status stored in-memory (TODO: migrate to Redis for multi-worker support)

### 3. Database-First with Prisma ORM
**Decision:** PostgreSQL with Prisma for type-safe database access.

**Rationale:**
- Strong data integrity with ACID compliance
- Prisma auto-generates types for Python (backend) and TypeScript (frontend)
- Async support for FastAPI compatibility
- Migration system for schema evolution

**Schema Organization:**
- 17 models in `/backend/prisma/schema.prisma`
- Relations enforce referential integrity
- JSON columns for flexible custom fields
- Enums for controlled vocabularies

### 4. AI Abstraction Layer with Prompt Versioning
**Decision:** Database-backed prompt management with A/B testing infrastructure.

**Rationale:**
- Decouple prompts from code for rapid iteration
- Version control for prompt changes
- A/B testing to optimize AI performance
- Multi-provider support (Claude, OpenAI, Gemini)

**Implementation:**
- `Prompt` model with `activeVersionId`
- `PromptVersion` for change tracking
- `PromptExperiment` for A/B tests with traffic splitting
- Usage telemetry (tokens, latency, errors) for optimization

### 5. YAML-Based Business Rules Engine
**Decision:** Store business rules in YAML files, not hardcoded in application.

**Rationale:**
- Non-developers (sales ops) can modify rules
- Version control for rule changes
- Override system per user/organization
- Centralized rule documentation

**Structure:**
- 40+ rules in `/backend/config/business-rules.yaml`
- 6 categories: Data Quality, Sales Hygiene, Forecasting, Progression, Engagement, Compliance
- Configurable operators: `is_empty`, `is_past`, `older_than_days`, `greater_than`, etc.
- Database overrides via `GlobalRuleOverride` and `CustomRule` models

### 6. Token Security with Encryption at Rest
**Decision:** Encrypt all CRM tokens (Salesforce, HubSpot) using Fernet symmetric encryption.

**Rationale:**
- Defense-in-depth: even if database is compromised, tokens are encrypted
- Per-user isolation: each user's tokens stored separately
- Auto-refresh before expiry

**Implementation:**
- `encryption_service.py` wraps Fernet encryption/decryption
- `ENCRYPTION_KEY` in environment variables (32-byte base64)
- Tokens encrypted before storage, decrypted on retrieval

### 7. Scheduled Reviews with APScheduler
**Decision:** Use APScheduler for cron-based pipeline reviews instead of external cron or cloud schedulers.

**Rationale:**
- Application-level scheduling (no external dependencies)
- Dynamic job creation via API
- Timezone-aware execution
- Auto-sync on backend startup

**Implementation:**
- `/backend/app/services/scheduler_service.py` manages APScheduler
- `ScheduledReview` model stores cron schedules
- Jobs enqueue background tasks via RQ
- Results delivered via Resend (email) or Slack webhooks

### 8. Authentication with Clerk (No Custom Auth)
**Decision:** Delegate all authentication to Clerk, verify JWTs in backend.

**Rationale:**
- Avoid building custom auth (security risk)
- Clerk handles sign-up, sign-in, password reset, MFA
- JWKS verification for stateless auth
- User auto-creation on first access

**Implementation:**
- Frontend: `@clerk/nextjs` middleware protects routes
- Backend: `auth.py` verifies JWT using Clerk's JWKS
- `get_current_user_id` dependency extracts `user_id` from token
- `require_auth` dependency raises 401 for unauthenticated requests

### 9. Next.js App Router with Server Components
**Decision:** Use Next.js 16 App Router (not Pages Router) with Server Components by default.

**Rationale:**
- Server Components reduce client bundle size
- Built-in data fetching with async/await
- File-based routing with route groups
- Streaming and suspense for better UX

**Patterns:**
- Server Components for data fetching (no client state)
- Client Components for interactivity (`'use client'`)
- Custom hooks for shared data fetching logic
- Route groups `(auth)`, `(platform)`, `(marketing)` for layout sharing

### 10. Tailwind CSS with Design Tokens
**Decision:** Use Tailwind CSS with CSS variables for theming, not CSS-in-JS.

**Rationale:**
- Utility-first CSS for rapid prototyping
- CSS variables enable dark mode without runtime overhead
- Design tokens centralize color/spacing decisions
- Tailwind v4 with `@theme inline` for zero-config

**Theme System:**
- Colors defined in CSS variables with `oklch()` color space
- Dark mode via `.dark` class (next-themes)
- Typography system with 3 fonts (Inter, Switzer, Inter Tight)
- Print styles optimized for PDF generation

---

## Coding Standards & Patterns

### Backend (Python/FastAPI)

#### File Structure
```python
# Route files follow this pattern:
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user_id, require_auth
from app.services import some_service
from app.models import SomeModel
from app.database import prisma

router = APIRouter()

@router.post("/some-endpoint")
async def some_endpoint(
    data: SomeModel,
    user_id: str = Depends(get_current_user_id)
):
    """
    Endpoint description.

    Args:
        data: Request payload
        user_id: Authenticated user ID

    Returns:
        Response model
    """
    # Validate inputs
    # Call service layer
    # Return response
```

#### Naming Conventions
- **Files**: `snake_case.py` (e.g., `salesforce_service.py`)
- **Functions**: `snake_case()` (e.g., `get_current_user_id()`)
- **Classes**: `PascalCase` (e.g., `AIService`, `RuleEvaluator`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Pydantic Models**: `PascalCase` (e.g., `AnalysisRequest`, `DealResponse`)

#### Error Handling
- Use `HTTPException` for API errors with appropriate status codes
- Log errors with context using Python's `logging` module
- Return structured error responses:
  ```python
  raise HTTPException(
      status_code=400,
      detail={"error": "Invalid file format", "field": "file"}
  )
  ```

#### Async/Await
- All route handlers and database calls are `async`
- Use `await` for Prisma queries
- Use `asyncio.gather()` for parallel operations

#### Type Hints
- Always use type hints for function arguments and returns
- Use Pydantic models for request/response validation
- Use `Optional[T]` for nullable values
- Use `List[T]`, `Dict[K, V]` for collections

#### Code Formatting
- **Black** for automatic formatting (line length 88)
- **Ruff** for linting
- Run `poetry run black .` before committing
- Run `poetry run ruff check .` to check for issues

### Frontend (TypeScript/React)

#### File Structure
```typescript
// Page component (Server Component by default)
export default async function SomePage() {
  const data = await fetch('...')
  return <SomeClientComponent data={data} />
}

// Client component
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function SomeClientComponent({ data }) {
  const [state, setState] = useState(null)

  return (
    <div className="flex flex-col gap-4">
      {/* ... */}
    </div>
  )
}
```

#### Naming Conventions
- **Files**: `kebab-case.tsx` for pages, `PascalCase.tsx` for components (e.g., `DealCard.tsx`)
- **Components**: `PascalCase` (e.g., `DealCard`, `NavigationBar`)
- **Functions**: `camelCase` (e.g., `handleSubmit`, `fetchDeals`)
- **Custom Hooks**: `useCamelCase` (e.g., `useAuthenticatedFetch`, `useRules`)
- **Constants**: `UPPER_SNAKE_CASE` or `camelCase` depending on scope
- **Types/Interfaces**: `PascalCase` (e.g., `Deal`, `AnalysisResult`)

#### Component Patterns
- **Functional components only** (no class components)
- **Server Components by default**, add `'use client'` only when needed
- **Prefer composition over inheritance**
- **Use children prop for layout components**
- **Destructure props** for clarity

#### Styling
- **Tailwind CSS utility classes** for all styling
- **No inline styles** unless absolutely necessary
- **Use `cn()` helper** from `lib/utils.ts` to merge classes:
  ```tsx
  import { cn } from '@/lib/utils'

  <div className={cn("flex items-center", isActive && "bg-blue-500")} />
  ```
- **Component variants** with `class-variance-authority`:
  ```tsx
  const buttonVariants = cva("base-classes", {
    variants: {
      variant: { default: "...", destructive: "..." },
      size: { sm: "...", lg: "..." }
    }
  })
  ```

#### State Management
- **Local state**: `useState` for component-specific state
- **Server state**: Custom hooks (e.g., `useRules`, `useDealReview`)
- **Global state**: Zustand store (`/lib/store.ts`) - use sparingly
- **Form state**: React Hook Form (if complex forms)

#### Data Fetching
- **Server Components**: Use native `fetch()` with Next.js caching
- **Client Components**: Use custom hooks that wrap `useAuthenticatedFetch`
- **Error handling**: Always handle loading/error states
- **Optimistic updates**: For better UX on mutations

#### Type Safety
- **Always define types** for props, state, API responses
- **Use type inference** where possible, but be explicit for public APIs
- **Avoid `any`** - use `unknown` and type guards instead
- **Use zod** for runtime validation if needed

#### File Imports
- **Absolute imports** with `@/` prefix:
  ```tsx
  import { Button } from '@/components/ui/button'
  import { useRules } from '@/hooks/useRules'
  ```
- **Group imports**: React, third-party, local components, styles

#### Code Formatting
- **Prettier** for automatic formatting (configured in `package.json`)
- **ESLint** for linting
- Run `npm run lint` before committing

### Database (Prisma)

#### Schema Conventions
- **Model names**: `PascalCase`, singular (e.g., `User`, `Deal`, `CRMConnection`)
- **Field names**: `camelCase` (e.g., `firstName`, `createdAt`)
- **Relations**: Descriptive names (e.g., `user User @relation(fields: [userId], references: [id])`)
- **Enums**: `PascalCase` for enum name, `UPPER_SNAKE_CASE` for values

#### Migrations
- Generate migrations: `npx prisma migrate dev --name descriptive_name`
- Apply migrations: `npx prisma migrate deploy` (production)
- Reset database: `npx prisma migrate reset` (development only)
- Generate client: `npx prisma generate` (after schema changes)

### Configuration Files (YAML)

#### Business Rules
```yaml
rules:
  - id: unique_rule_id
    name: Human-readable rule name
    category: DATA_QUALITY  # or SALES_HYGIENE, FORECASTING, etc.
    severity: CRITICAL  # or WARNING, INFO
    description: Rule explanation
    condition:
      field: closeDate
      operator: is_past
    message: Error message shown to users
    remediation_action: What to do to fix
    remediation_owner: Who should fix it
    applies_to_stages: ["Proposal", "Negotiation"]  # optional
    automatable: true  # can this be auto-fixed?
```

### Git Workflow

#### Branch Naming
- `main` - Production branch
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring

#### Commit Messages
- Use conventional commits format:
  - `feat: add scheduled review email templates`
  - `fix: correct Salesforce token refresh logic`
  - `refactor: extract rule evaluation to service`
  - `docs: update API documentation`

#### Pull Requests
- Write descriptive PR titles
- Include summary of changes
- Reference related issues
- Ensure CI passes before merging

---

## Current State & Roadmap

### What's Currently Working ✅

#### Core Features
- ✅ **File Upload & Analysis**: CSV/Excel upload with AI-powered field mapping
- ✅ **CRM Integrations**: Salesforce and HubSpot OAuth with auto-refresh
- ✅ **Business Rules Engine**: 40+ rules across 6 categories with YAML configuration
- ✅ **AI Analysis**: Claude Sonnet 4 integration for qualitative deal assessment
- ✅ **Scheduled Reviews**: Cron-based pipeline scans with email/Slack delivery
- ✅ **Results Viewer**: Detailed deal-by-deal analysis with violation breakdown
- ✅ **Health Scoring**: 0-100 pipeline health score calculation
- ✅ **CSV Export**: Download analysis results with full deal data

#### Platform Features
- ✅ **Authentication**: Clerk integration with JWT verification
- ✅ **Admin Panel**: User management, API testing, database monitoring
- ✅ **Prompt Management**: Database-backed prompt versioning with A/B testing
- ✅ **Team/Organizations**: Multi-tenant support with role-based access
- ✅ **Custom Rules**: User and org-specific rule overrides
- ✅ **Subscription Management**: Stripe integration for tiered subscriptions
- ✅ **Dark Mode**: Full dark mode support with next-themes

#### Infrastructure
- ✅ **Background Jobs**: RQ (Redis Queue) for async processing
- ✅ **Scheduled Tasks**: APScheduler for cron jobs
- ✅ **Database**: PostgreSQL with Prisma ORM and migrations
- ✅ **Email**: Resend integration with Jinja2 templates
- ✅ **Logging**: Structured logging with performance monitoring

### Known Issues & TODOs 🚧

#### High Priority
- ⚠️ **Status Store Migration**: In-memory status store should use Redis for multi-worker support
  - **File**: `/backend/app/routes/analyze.py`
  - **Current**: `status_store = {}` (in-memory dict)
  - **TODO**: Replace with Redis to support horizontal scaling

- ⚠️ **Token Refresh Edge Cases**: Handle concurrent token refresh requests
  - **File**: `/backend/app/services/salesforce_service.py`, `/backend/app/services/hubspot_service.py`
  - **TODO**: Add distributed lock (Redis) to prevent duplicate refreshes

- ⚠️ **Error Handling in Scheduled Reviews**: Retry logic needs improvement
  - **File**: `/backend/app/jobs/review_job.py`
  - **TODO**: Implement exponential backoff, dead letter queue

#### Medium Priority
- 📝 **Prompt A/B Testing UI**: Admin UI exists but needs user-facing results dashboard
  - **File**: `/frontend/app/admin/prompts/` (partial implementation)
  - **TODO**: Add experiment results visualization with metrics

- 📝 **Rule Override UI**: Users can create custom rules but no UI for global rule overrides
  - **TODO**: Add settings page for enabling/disabling global rules

- 📝 **HubSpot Write-Back**: Read-only integration, no write support yet
  - **File**: `/backend/app/services/hubspot_service.py`
  - **TODO**: Implement `update_deal()` method similar to Salesforce

- 📝 **Email Template Editor**: Templates stored in database but no WYSIWYG editor
  - **TODO**: Add visual editor for OutputTemplate Jinja2 templates

#### Low Priority
- 🔹 **Forecast Model**: Basic forecasting exists but needs ML model
  - **File**: `/backend/app/services/forecast_service.py`
  - **TODO**: Train ML model on historical data for better predictions

- 🔹 **Analytics Dashboard**: Basic metrics exist but need richer visualizations
  - **File**: `/frontend/app/(platform)/dashboard/page.tsx`
  - **TODO**: Add time-series charts, team comparison, trend analysis

- 🔹 **Mobile Responsiveness**: Platform works but needs mobile optimization
  - **TODO**: Audit and improve mobile layouts for key pages

- 🔹 **Export to CRM**: Users can download CSV but not push fixes back to CRM
  - **TODO**: Add bulk update feature to write remediation actions back to Salesforce/HubSpot

### Immediate Next Steps (Prioritized)

1. **Migrate Status Store to Redis** (1-2 hours)
   - Replace in-memory `status_store` with Redis
   - Update status polling endpoints to use Redis
   - Test with multiple workers

2. **Add Token Refresh Locking** (2-3 hours)
   - Implement Redis-based distributed lock
   - Update Salesforce/HubSpot services
   - Add tests for concurrent refresh scenarios

3. **Improve Scheduled Review Error Handling** (3-4 hours)
   - Add exponential backoff to retry logic
   - Implement dead letter queue for failed jobs
   - Add alerting for critical failures

4. **HubSpot Write-Back** (4-6 hours)
   - Implement `update_deal()` in HubSpot service
   - Add UI controls for write-back
   - Add audit logging for changes

5. **Rule Override UI** (4-6 hours)
   - Add settings page for global rule management
   - Allow users to enable/disable rules
   - Support threshold customization

### Future Enhancements (Backlog)

- 🔮 **Slack Bot**: Interactive Slack notifications with action buttons
- 🔮 **Pipedrive Integration**: Add third CRM connector
- 🔮 **Microsoft Dynamics**: Enterprise CRM integration
- 🔮 **SSO Support**: SAML/OIDC for enterprise customers
- 🔮 **Audit Logging**: Track all user actions for compliance
- 🔮 **Webhook Support**: Allow users to receive analysis results via webhooks
- 🔮 **Public API**: RESTful API for third-party integrations
- 🔮 **White-labeling**: Custom branding for enterprise customers

---

## Contributing Guidelines

### For New Developers

1. **Read this document first** - It's the source of truth
2. **Set up local environment**:
   ```bash
   # Backend
   cd backend
   poetry install
   cp .env.example .env
   # Edit .env with your credentials
   npx prisma generate
   npx prisma migrate dev

   # Frontend
   cd frontend
   npm install
   cp .env.local.example .env.local
   # Edit .env.local with your Clerk keys

   # Start all services
   ./start_revtrust.sh
   ```

3. **Understand the data flow**:
   - User uploads CSV → `/api/analyze` → Background job → Results in DB
   - User connects CRM → OAuth flow → Tokens encrypted → Stored in DB
   - User triggers scan → `/api/scan` → CRM fetch → Background job → Results in DB

4. **Follow existing patterns**:
   - Look at similar routes/components before creating new ones
   - Use existing services and utilities
   - Match the code style in the file you're editing

5. **Test your changes**:
   - Backend: `pytest` (when tests exist)
   - Frontend: Manual testing + `npm run lint`
   - Integration: Test full user flows

### For AI Agents

1. **Always read existing code** before suggesting changes
2. **Follow naming conventions** exactly as specified above
3. **Use existing patterns** - don't introduce new patterns without justification
4. **Preserve type safety** - always add types for new code
5. **Update this document** if you make architectural changes
6. **Reference file paths and line numbers** when explaining code (e.g., `main.py:42`)

---

## Environment Variables Reference

### Backend (`.env`)
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/revtrust"

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# Authentication
CLERK_SECRET_KEY="sk_test_..."

# Salesforce OAuth
SALESFORCE_CLIENT_ID="..."
SALESFORCE_CLIENT_SECRET="..."
SALESFORCE_REDIRECT_URI="http://localhost:8000/api/crm/oauth/salesforce/callback"

# HubSpot OAuth
HUBSPOT_CLIENT_ID="..."
HUBSPOT_CLIENT_SECRET="..."
HUBSPOT_REDIRECT_URI="http://localhost:8000/api/crm/oauth/hubspot/callback"

# Encryption
ENCRYPTION_KEY="base64-encoded-32-byte-key"

# Email
RESEND_API_KEY="re_..."

# Stripe
STRIPE_API_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Redis
REDIS_URL="redis://localhost:6379"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`.env.local`)
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# API
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

---

## Quick Reference

### Start/Stop Services
```bash
# Start all services (PostgreSQL, Redis, Backend, Worker, Frontend)
./start_revtrust.sh

# Stop all services gracefully
./stop_revtrust.sh

# Check service health
./health_check.sh
```

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (GUI)
npx prisma studio
```

### Run Backend
```bash
cd backend
poetry run uvicorn app.main:app --reload --port 8000
```

### Run Worker
```bash
cd backend
poetry run rq worker
```

### Run Frontend
```bash
cd frontend
npm run dev
```

### Code Quality
```bash
# Backend formatting
cd backend
poetry run black .
poetry run ruff check .

# Frontend linting
cd frontend
npm run lint
```

---

## Support & Resources

- **Repository**: (Add your repo URL)
- **Documentation**: `/docs/` directory
- **Issue Tracking**: (Add your issue tracker URL)
- **Slack/Discord**: (Add your team chat URL)

---

*Last Updated: 2026-01-11*
*Version: 1.0.0*
