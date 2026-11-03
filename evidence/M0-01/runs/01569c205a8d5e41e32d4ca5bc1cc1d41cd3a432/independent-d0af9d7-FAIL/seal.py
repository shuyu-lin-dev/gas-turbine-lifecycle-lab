import hashlib
import json
from pathlib import Path
import subprocess

root = Path.cwd().resolve()
directory = root / '.scratch-runtime/coordinator-m001-rereview'
manifest = {}


def add(path):
    manifest[str(path.relative_to(directory))] = hashlib.sha256(path.read_bytes()).hexdigest()


for path in sorted(directory.iterdir()):
    if path.is_file() and path.name != 'SHA256SUMS.json':
        add(path)
for path in sorted((directory / 'remote').iterdir()):
    assert path.is_file()
    add(path)
for run in [directory / 'main-01', directory / 'clean-d0af9d7-review/.scratch-runtime/coordinator-m001-rereview/clean-01']:
    source = json.loads((run / 'SHA256SUMS.json').read_text())
    for name, expected in source.items():
        path = run / name
        assert hashlib.sha256(path.read_bytes()).hexdigest() == expected
        add(path)
    add(run / 'SHA256SUMS.json')
report = directory / 'REVIEW.md'
assert 'P2-03' in report.read_text()
assert subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip() == 'd0af9d76a459f838f6f8fb8ee656a7b60fc6c790'
assert subprocess.check_output(['git', 'status', '--porcelain']).decode().strip() == ''
(directory / 'SHA256SUMS.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'files': len(manifest), 'REVIEW_sha256': hashlib.sha256(report.read_bytes()).hexdigest(),
                  'manifest_sha256': hashlib.sha256((directory / 'SHA256SUMS.json').read_bytes()).hexdigest()}))
