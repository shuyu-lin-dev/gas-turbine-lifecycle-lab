import os
from pathlib import Path
import sys

root = Path.cwd()
sys.path.insert(0, str(root))
from scripts.verify_m0_01 import Run

output = root / '.scratch-runtime/m0-01-origin-structure/frontend-query-red'
output.mkdir()
run = Run(root, output)
try:
    run.api('api-a', 8201, root / 'backend/.venv/bin/python')
    run.web('web-empty-query', 'http://127.0.0.1:8201/api/v1?')
    run.browser('empty-query', 'http://127.0.0.1:5173', 'http://127.0.0.1:8201/api/v1/health', mode='config')
finally:
    for process, record, log in run.processes:
        if process.poll() is None:
            run.stop(process)
