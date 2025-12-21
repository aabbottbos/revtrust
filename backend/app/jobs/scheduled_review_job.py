"""
RQ job wrapper for scheduled reviews
"""

import asyncio
from app.services.review_job_service import get_review_job_service
import logging

logger = logging.getLogger(__name__)


def execute_scheduled_review(scheduled_review_id: str, run_id: str):
    """
    RQ job to execute a scheduled review
    This is the function that gets queued and executed by workers
    """

    this is the function that gets queued and executed by workers
    """

    logger.info(f"🚀 Starting scheduled review job")
    logger.info(f"   Review ID: {scheduled_review_id}")
    logger.info(f"   Run ID: {run_id}")

    # Create event loop and run async job
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        service = get_review_job_service()
        result = loop.run_until_complete(
            service.execute_review(scheduled_review_id, run_id)
        )

            service.execute_review(scheduled_review_id, run_id)
        )

        logger.info(f"✅ Job completed: {result['status']}")
        return result

    except Exception as e:
        logger.error(f"❌ Job failed: {e}", exc_info=True)
        raise

    finally:
        loop.close()
