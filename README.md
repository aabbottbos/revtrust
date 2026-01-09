# RevTrust - Sales Pipeline Hygiene Platform

Turn messy pipeline data into accurate forecasts and actionable strategy.

🚀 **[Quick Start](docs/deployment/quick_start.md)** | 📚 **[Documentation](docs/index.md)**

## Overview

RevTrust is an AI-powered platform that analyzes sales pipeline data to identify risks, enforce hygiene rules, and improve forecasting accuracy.

### Key Features
- **AI Analysis**: Qualitative feedback on deals using Anthropic Claude.
- **Business Rules**: 14+ automated checks for data quality and process adherence.
- **Pipeline Health**: Instant scoring (0-100) and violation reporting.
- **Secure**: SOC2-ready with Clerk authentication and strict data controls.

## Documentation

We have organized our documentation to help you get started quickly:

- **[📚 Documentation Home](docs/index.md)**
- **[🏗 Architecture](docs/architecture.md)**
- **[🔌 API Reference](docs/api/endpoints.md)**
- **[💻 Development Guide](docs/development.md)**
- **[🚀 Deployment](docs/deployment/overview.md)**

## Quick Start

### Backend
```bash
cd backend
poetry install
poetry run python -m app.main
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

See [Development Guide](docs/development.md) for detailed setup instructions.

## License
Private Property of RevTrust.
