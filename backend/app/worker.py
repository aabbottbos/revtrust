"""
RQ worker configuration and job definitions
"""

import os
import sys
from redis import Redis
from rq import Worker, Queue

# Setup Redis connection
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_conn = Redis.from_url(redis_url)

# Define queues
default_queue = Queue('default', connection=redis_conn)
scheduled_reviews_queue = Queue('scheduled_reviews', connection=redis_conn)

def run_worker():
    """Run RQ worker"""
    # Use SimpleWorker to avoid fork() issues on macOS Python 3.14
    # SimpleWorker executes jobs in the same process instead of forking
    from rq import SimpleWorker
    worker = SimpleWorker([scheduled_reviews_queue, default_queue], connection=redis_conn)
    worker.work()

if __name__ == '__main__':
    run_worker()
