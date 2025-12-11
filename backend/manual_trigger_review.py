"""
Manually trigger a scheduled review
"""

import asyncio
from app.services.review_job_service import get_review_job_service
from prisma import Prisma
import uuid

async def trigger_review(scheduled_review_id: str):
    """Manually trigger a scheduled review"""

    print(f"🚀 Manually triggering scheduled review: {scheduled_review_id}")

    # Create ReviewRun record
    prisma = Prisma()
    await prisma.connect()

    try:
        run = await prisma.reviewrun.create(
            data={
                "scheduledReviewId": scheduled_review_id,
                "status": "queued"
            }
        )
        print(f"✅ Created ReviewRun: {run.id}")

        # Execute the review directly
        service = get_review_job_service()
        result = await service.execute_review(scheduled_review_id, run.id)

        print(f"\n✅ Review completed!")
        print(f"   Status: {result['status']}")
        print(f"   Analysis ID: {result.get('analysis_id')}")

        return result

    finally:
        await prisma.disconnect()

if __name__ == "__main__":
    # The scheduled review ID from the user
    schedule_id = "dc48c3d8-e727-47e4-881c-795142199849"
    result = asyncio.run(trigger_review(schedule_id))
