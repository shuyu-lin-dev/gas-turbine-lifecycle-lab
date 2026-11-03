from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

root = Path.cwd().resolve()
output = root / '.scratch-runtime/coordinator-m001-review'
candidate = '73d7e29cb2e837eceb4767932e116e76e4916d0f'
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip() == candidate
assert subprocess.check_output(['git', 'status', '--porcelain'], text=True) == ''
final = {'at': datetime.now(timezone.utc).isoformat(), 'head': candidate, 'status_porcelain': '',
         'tracked_files_modified_by_review': False, 'remote_mutations': False}
(output / 'final-state.json').write_text(json.dumps(final, ensure_ascii=False, indent=2) + '\n')
paths = [path for path in output.iterdir() if path.is_file() and path.name != 'SHA256SUMS.json']
for directory in [output / 'main-01', output / 'supplement',
                  output / 'clean-73d7e29-review/.scratch-runtime/coordinator-m001-review/clean-01']:
    paths.extend(path for path in directory.iterdir() if path.is_file())
manifest = {str(path.relative_to(output)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(paths)}
(output / 'SHA256SUMS.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'files': len(manifest), 'review_sha256': manifest['REVIEW.md'],
                  'manifest_sha256': hashlib.sha256((output / 'SHA256SUMS.json').read_bytes()).hexdigest()}, indent=2))
