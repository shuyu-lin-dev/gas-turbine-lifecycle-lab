import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent
run = root / 'clean-01569c2/.scratch-runtime/coordinator-m001-origin-review/frozen-clean'
paths = [path for path in root.iterdir() if path.is_file() and path.name != 'SHA256SUMS.json']
paths += [path for path in run.iterdir() if path.is_file()]
manifest = {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(paths)}
(root / 'SHA256SUMS.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
assert all(hashlib.sha256((root / name).read_bytes()).hexdigest() == expected for name, expected in manifest.items())
print(json.dumps({'files': len(manifest), 'report_sha256': manifest['REVIEW.md']}))
