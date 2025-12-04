"""
Analytics event logging
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.auth import get_current_user_id
import json
from pathlib import Path
from collections import defaultdict

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

EVENTS_FILE = "events_log.jsonl"


class AnalyticsEvent(BaseModel):
    event: str
    properties: dict | None = None
    timestamp: str
    page: str | None = None


@router.post("/event")
async def log_event(
    event: AnalyticsEvent,
    user_id: str = Depends(get_current_user_id)
):
    """Log analytics event"""

    event_entry = {
        "user_id": user_id,
        "event": event.event,
        "properties": event.properties or {},
        "page": event.page,
        "timestamp": event.timestamp
    }

    # Ensure directory exists
    events_path = Path(EVENTS_FILE)
    events_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(events_path, "a") as f:
            f.write(json.dumps(event_entry) + "\n")

        # Log important events to console
        if event.event in ["payment_completed", "upgrade_clicked", "ai_review_completed"]:
            print(f"📊 {event.event.upper()}: {user_id} - {event.properties}")

        return {"status": "success"}

    except Exception as e:
        print(f"Error logging event: {e}")
        # Don't fail the request if analytics fails
        return {"status": "error", "message": str(e)}


@router.get("/events/summary")
async def get_events_summary():
    """Get event summary (simple version - for admin dashboard)"""

    try:
        events_path = Path(EVENTS_FILE)
        if not events_path.exists():
            return {"total_events": 0, "by_type": {}, "recent": []}

        events = []
        with open(events_path, "r") as f:
            for line in f:
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

        # Count by event type
        by_type = defaultdict(int)
        for event in events:
            event_name = event["event"]
            by_type[event_name] += 1

        # Get recent events (last 50)
        recent_events = events[-50:] if len(events) > 50 else events
        recent_events.reverse()

        return {
            "total_events": len(events),
            "by_type": dict(by_type),
            "recent": recent_events
        }

    except FileNotFoundError:
        return {"total_events": 0, "by_type": {}, "recent": []}
    except Exception as e:
        print(f"Error reading events: {e}")
        raise HTTPException(status_code=500, detail="Failed to read events")


@router.get("/events/user/{user_id}")
async def get_user_events(
    user_id: str,
    limit: int = 50
):
    """Get events for a specific user (admin only - add auth later)"""

    try:
        events_path = Path(EVENTS_FILE)
        if not events_path.exists():
            return {"events": []}

        user_events = []
        with open(events_path, "r") as f:
            for line in f:
                try:
                    event = json.loads(line)
                    if event.get("user_id") == user_id:
                        user_events.append(event)
                except json.JSONDecodeError:
                    continue

        # Return most recent first
        user_events.reverse()

        return {"events": user_events[:limit], "total": len(user_events)}

    except Exception as e:
        print(f"Error reading user events: {e}")
        raise HTTPException(status_code=500, detail="Failed to read user events")
