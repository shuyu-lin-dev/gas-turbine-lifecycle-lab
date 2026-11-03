from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess

root = Path.cwd().resolve()
output = root / '.scratch-runtime/coordinator-m001-review'
clone = output / 'clean-73d7e29-review'
candidate = '73d7e29cb2e837eceb4767932e116e76e4916d0f'
records = []
env = dict(os.environ, TMPDIR=str(output / 'env-tmp'), TMP=str(output / 'env-tmp'),
           TEMP=str(output / 'env-tmp'), PYTHONDONTWRITEBYTECODE='1',
           LD_LIBRARY_PATH=str(root / '.scratch-runtime/m0-01/browser-deps/usr/lib/x86_64-linux-gnu'))


def command(argv, cwd=root):
    result = subprocess.run(argv, cwd=cwd, env=env, capture_output=True, text=True)
    records.append({'argv': [str(item) for item in argv], 'cwd': str(cwd),
                    'at': datetime.now(timezone.utc).isoformat(), 'exit_code': result.returncode,
                    'stdout': result.stdout, 'stderr': result.stderr})
    (output / 'final-commands.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    assert result.returncode == 0, records[-1]
    return result.stdout


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


runs = {}
for name, directory in [('main', output / 'main-01'),
                        ('clean', clone / '.scratch-runtime/coordinator-m001-review/clean-01')]:
    manifest = directory / 'SHA256SUMS.json'
    files = json.loads(manifest.read_text())
    assert all(sha(directory / name) == expected for name, expected in files.items())
    entries = json.loads((directory / 'commands.json').read_text())
    assert all(item['exit_code'] == 0 for item in entries)
    for item in entries:
        for channel in ['stdout', 'stderr']:
            assert hashlib.sha256(item[channel].encode()).hexdigest() == item[channel + '_sha256']
    processes = json.loads((directory / 'processes.json').read_text())
    assert all('stopped_at' in item and item['exit_code'] in [0, -15, 143] for item in processes)
    result = json.loads((directory / 'results.json').read_text())
    assert result['tested_code_sha'] == candidate
    runs[name] = {'directory': str(directory), 'manifest_sha256': sha(manifest),
                  'command_count': len(entries), 'all_exit_zero': True,
                  'all_command_hashes_match': True, 'manifest_entries': len(files),
                  'all_manifest_hashes_match': True, 'all_processes_stopped': True,
                  'raw_results': result}

for cwd in [root, clone]:
    assert command(['git', 'rev-parse', 'HEAD'], cwd).strip() == candidate
    assert command(['git', 'status', '--porcelain'], cwd) == ''
    command(['git', 'diff', '--check', 'b8ad3150cf4480f8e205926541aeeccb072f7f80', candidate], cwd)
assert command(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], clone).strip() == str(clone / '.git')
assert not (clone / '.git/objects/info/alternates').exists()
assert not (root / 'frontend/node_modules').samefile(clone / 'frontend/node_modules')
assert not (root / 'backend/.venv').samefile(clone / 'backend/.venv')
assert not (output / 'env-main-01/cache').samefile(clone / '.scratch-runtime/coordinator-m001-review/env-clean-01/cache')

scope = command(['git', 'diff', '--name-only', 'b8ad3150cf4480f8e205926541aeeccb072f7f80...'+candidate]).splitlines()
assert len(scope) == 32
source = [{'path': name, 'sha256': sha(root / name), 'clone_sha256': sha(clone / name)} for name in scope]
assert all(item['sha256'] == item['clone_sha256'] for item in source)
wheel_source = clone / '.scratch-runtime/coordinator-m001-review/clean-01/wheel-env/lib/python3.12/site-packages/gt_lifecycle_api/app.py'
assert sha(wheel_source) == sha(root / 'backend/src/gt_lifecycle_api/app.py')
browser = '/home/lsy/.agent-browser/browsers/chrome-156.0.8078.80/chrome'
command([browser, '--version'])
command(['sha256sum', browser, str(root / '.scratch-runtime/m0-01/discovery/uv-x86_64-unknown-linux-gnu/uv')])
command(['ss', '-ltnp'])
command(['docker', 'ps', '--format', '{{json .}}'])
supplement = json.loads((output / 'supplement/results.json').read_text())
assert supplement['samePageRecovery'] == 'PASS'
assert supplement['wildcardConfigurationRejected'] is False
assert (output / 'supplement.exit').read_text().strip() == '1'
assert all('stoppedAt' in item for item in supplement['processes'])
check_runs = json.loads((output / 'ci-check-runs.json').read_text())
statuses = json.loads((output / 'ci-status.json').read_text())
audit = {'at': datetime.now(timezone.utc).isoformat(), 'candidate': candidate, 'runs': runs,
         'source_files': source, 'clean_dependencies_and_cache_independent': True,
         'wheel_source_sha256': sha(wheel_source), 'same_page_recovery': 'PASS',
         'wildcard_configuration': 'FAIL', 'supplement_exit_code': 1,
         'ci_check_runs': check_runs['total_count'], 'ci_statuses': statuses['total_count'],
         'final_required': {**{f'M0-01-A0{index}': 'PASS' for index in range(1, 5)}, 'M0-01-A05': 'FAIL'}}
(output / 'independent-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: audit[key] for key in ['candidate', 'final_required', 'ci_check_runs', 'ci_statuses']}))
