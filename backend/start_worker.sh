#!/bin/bash
# Start RQ worker for scheduled reviews

cd "$(dirname "$0")"

# macOS fork safety workaround for Python 3.14
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES

echo "🔧 Starting RQ worker for scheduled reviews..."
echo "📍 Queue: scheduled_reviews, default"
echo "⏸️  Press Ctrl+C to stop"
echo ""

poetry run python -m app.worker
