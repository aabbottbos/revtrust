# API Documentation

The RevTrust API is built with FastAPI and organized into modular routers.

## Authentication
All protected endpoints require a Bearer token in the `Authorization` header. This token is issued by Clerk on the frontend.

```bash
Authorization: Bearer <clerk_jwt_token>
```

## Core Endpoints

### Health
- `GET /api/health`: Service health check. Returns `{"status": "ok"}`.

### Analysis (`/api/analyze`)
- `POST /api/analyze`: Upload a CSV/XLSX file for processing.
    - **Header**: `multipart/form-data`
    - **Body**: `file` (Binary)
- `GET /api/analyze/{analysis_id}`: Retrieve results for a specific analysis.

### Rules (`/api/rules`)
- `GET /api/rules`: List all active business rules.
- `POST /api/rules/validate`: Run validation against a specific deal payload.

## Feature Modules

### CRM Integration
- `GET /api/crm/oauth/connect`: Initiate OAuth flow (HubSpot/Salesforce).
- `POST /api/crm/sync`: Trigger a sync of pipeline data.

### Forecasting
- `GET /api/forecast`: Get current forecast based on pipeline data.

### Users & Organizations
- `GET /api/user/me`: Get current user profile.
- `GET /api/organization/settings`: Get organization-level settings.

## Webhooks
- `POST /api/webhooks/stripe`: Handle Stripe payment events.
- `POST /api/webhooks/clerk`: Handle Clerk user events.
