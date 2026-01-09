# RevTrust Documentation

Welcome to the RevTrust documentation. This project helps turn messy pipeline data into accurate forecasts and actionable strategy.

## 📚 Documentation Structure

### [Deployment](./deployment/overview.md)
- **[Quick Start](./deployment/quick_start.md)**: Get up and running in minutes.
- **[Full Deployment Guide](./deployment/overview.md)**: Comprehensive deployment instructions for Docker, Vercel, and Cloud platforms.

### [Guides](./guides/startup.md)
- **[Startup Guide](./guides/startup.md)**: How to start the application locally.
- **[Authentication](./guides/authentication.md)**: Implementation details for Clerk auth.
- **[Stripe Setup](./guides/stripe.md)**: Configuring payments.
- **[Git Scripts](./guides/git_scripts.md)**: Utility scripts for git management.
- **[Monitoring](./guides/monitoring.md)**: Setting up monitoring for scheduled reviews.

### [Architecture](./architecture.md)
- **[System Overview](./architecture.md)**: High-level system design and component interaction.
- **[Tech Stack](./architecture.md#tech-stack)**: Justification for technology choices.

### [API Reference](./api/endpoints.md)
- **[Endpoints](./api/endpoints.md)**: Detailed API documentation for backend services.

### [Development](./development.md)
- **[Setup & Contribution](./development.md)**: Guidelines for contributing to the project.
- **[Testing](./development.md#testing)**: How to run and write tests.

---

## 🏗 Project Structure

```
revtrust/
├── backend/          # FastAPI backend service
├── frontend/         # Next.js frontend application
├── docs/             # Project documentation (You are here)
└── actions/          # GitHub Actions workflows
```
