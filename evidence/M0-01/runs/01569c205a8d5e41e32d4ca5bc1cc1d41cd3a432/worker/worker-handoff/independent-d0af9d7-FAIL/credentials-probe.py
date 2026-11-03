import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess

root = Path.cwd().resolve()
output = root / '.scratch-runtime/coordinator-m001-rereview'
parser = argparse.ArgumentParser()
parser.add_argument('--python', type=Path, default=output / 'main-01/wheel-env/bin/python')
parser.add_argument('--name', default='credentials-probe')
args = parser.parse_args()
python = args.python.absolute()
records = []
for origin, accepted in [('http://example.com', True), ('http://user:password@example.com', False),
                         ('http://@example.com', False), ('http://:@example.com', False)]:
    argv = [str(python), '-B', '-c', 'import gt_lifecycle_api.app; print(gt_lifecycle_api.app.origins)']
    result = subprocess.run(argv, env=dict(os.environ, API_CORS_ORIGINS=json.dumps([origin])),
                            capture_output=True, text=True, timeout=10)
    records.append({'at': datetime.now(timezone.utc).isoformat(), 'cwd': str(root),
                    'argv': argv, 'API_CORS_ORIGINS': json.dumps([origin]),
                    'expected_accepted': accepted, 'exit_code': result.returncode,
                    'stdout': result.stdout, 'stderr': result.stderr,
                    'state': 'PASS' if (result.returncode == 0) == accepted else 'FAIL'})
source = root / 'backend/src/gt_lifecycle_api/app.py'
installed = python.parent.parent / 'lib/python3.12/site-packages/gt_lifecycle_api/app.py'
record = {'candidate': subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip(),
          'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'installed_sha256': hashlib.sha256(installed.read_bytes()).hexdigest(), 'cases': records}
assert record['source_sha256'] == record['installed_sha256']
(output / f'{args.name}.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(record, ensure_ascii=False, indent=2))
assert all(item['state'] == 'PASS' for item in records), 'origin配置拒绝断言失败'
