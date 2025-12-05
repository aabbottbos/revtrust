"""
Direct test of scheduled review without RQ worker
This bypasses the fork() issue on macOS + Python 3.14
"""

import asyncio
from app.services.review_job_service import get_review_job_service

async def test_review():
    schedule_id = "fed65b6e-4b5b-4283-875b-9cfd9f218837"
    run_id = "test-run-" + str(__import__('uuid').uuid4())
    
    print(f"🧪 Testing scheduled review directly...")
    print(f"   Schedule ID: {schedule_id}")
    print(f"   Run ID: {run_id}")
    
    service = get_review_job_service()
    result = await service.execute_review(schedule_id, run_id)
    
    print(f"\n✅ Result: {result['status']}")
    print(f"   Analysis ID: {result.get('analysis_id')}")
    
    return result

if __name__ == "__main__":
    result = asyncio.run(test_review())
    print(f"\n📊 Full result:")
    print(result)
