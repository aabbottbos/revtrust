"""
RQ job wrapper for scheduled reviews
"""

import asyncio
from app.services.review_job_service import get_review_job_service


def execute_scheduled_review(scheduled_review_id: str, run_id: str):
    """
    RQ job to execute a scheduled review
    This is the function that gets queued and executed by workers
    """

    print(f"🚀 Starting scheduled review job")
    print(f"   Review ID: {scheduled_review_id}")
    print(f"   Run ID: {run_id}")

    # Create event loop and run async job
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        service = get_review_job_service()
        result = loop.run_until_complete(
            service.execute_review(scheduled_review_id, run_id)
        )

        print(f"✅ Job completed: {result['status']}")
        return result

    except Exception as e:
        print(f"❌ Job failed: {e}")
        raise

    finally:
        loop.close()
