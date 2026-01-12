
import sys
import os
from pathlib import Path

# Add the backend directory to sys.path so that 'app' can be imported
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))
