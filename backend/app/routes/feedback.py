"""
Feedback collection routes
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.auth import get_current_user_id
import json
import os
from pathlib import Path

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

# Simple file-based storage (upgrade to database later)
FEEDBACK_FILE = "feedback_log.jsonl"


class FeedbackSubmission(BaseModel):
    feedback: str
    sentiment: str | None = None
    page: str
    timestamp: str


@router.post("")
async def submit_feedback(
    submission: FeedbackSubmission,
    user_id: str = Depends(get_current_user_id)
):
    """Collect user feedback"""

    feedback_entry = {
        "user_id": user_id,
        "feedback": submission.feedback,
        "sentiment": submission.sentiment,
        "page": submission.page,
        "timestamp": submission.timestamp
    }

    # Ensure directory exists
    feedback_path = Path(FEEDBACK_FILE)
    feedback_path.parent.mkdir(parents=True, exist_ok=True)

    # Append to log file
    try:
        with open(feedback_path, "a") as f:
            f.write(json.dumps(feedback_entry) + "\n")

        # Log to console for monitoring
        print(f"📝 Feedback from {user_id} ({submission.sentiment}): {submission.feedback[:100]}...")

        # Alert on negative feedback
        if submission.sentiment == "negative":
            print(f"🚨 NEGATIVE FEEDBACK from {user_id}: {submission.feedback}")
            # TODO: Send email notification to founder

        return {"status": "success", "message": "Feedback received"}

    except Exception as e:
        print(f"Error logging feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to save feedback")


@router.get("/recent")
async def get_recent_feedback(limit: int = 20):
    """Get recent feedback (admin only - add auth later)"""

    try:
        feedback_path = Path(FEEDBACK_FILE)
        if not feedback_path.exists():
            return {"feedback": []}

        feedback_list = []
        with open(feedback_path, "r") as f:
            for line in f:
                feedback_list.append(json.loads(line))

        # Return most recent first
        feedback_list.reverse()

        return {"feedback": feedback_list[:limit]}

    except FileNotFoundError:
        return {"feedback": []}
    except Exception as e:
        print(f"Error reading feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to read feedback")
