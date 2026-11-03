from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request

root = Path.cwd().resolve()
output = root / '.scratch-runtime/coordinator-m001-rereview'
clone = output / 'clean-d0af9d7-review'
candidate = 'd0af9d76a459f838f6f8fb8ee656a7b60fc6c790'
base = 'b8ad3150cf4480f8e205926541aeeccb072f7f80'
criteria = '18a9210947e0114a8bbc6a10c8864701dfb8539e'
commands = []
report = {'session': os.environ['CODEX_THREAD_ID'], 'at': datetime.now(timezone.utc).isoformat(),
          'candidate': candidate, 'criteria': criteria, 'base': base, 'commands': commands}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def command(argv, cwd=root):
    result = subprocess.run(argv, cwd=cwd, capture_output=True)
    commands.append({'argv': argv, 'cwd': str(cwd), 'exit_code': result.returncode,
                     'stdout': result.stdout.decode(), 'stderr': result.stderr.decode()})
    assert result.returncode == 0, commands[-1]
    return result.stdout.decode().strip()


def manifest(directory):
    path = directory / 'SHA256SUMS.json'
    items = json.loads(path.read_text())
    appended = []
    for name, expected in items.items():
        content = (directory / name).read_bytes()
        actual = sha(content)
        if actual != expected:
            assert directory == root / '.scratch-runtime/coordinator-m001-review'
            assert name in ['coordination.md', 'session.jsonl']
            prefix = hashlib.sha256()
            length = 0
            matched = False
            for line in content.splitlines(keepends=True):
                prefix.update(line)
                length += len(line)
                if prefix.hexdigest() == expected:
                    matched = True
                    break
            assert matched, str(directory / name)
            appended.append({'name': name, 'expected_prefix_sha256': expected, 'prefix_bytes': length,
                             'current_sha256': actual, 'current_bytes': len(content)})
    return {'path': str(path.relative_to(root)), 'sha256': sha(path.read_bytes()), 'count': len(items),
            'appended_auxiliary_records': appended}


report['manifests'] = []
for directory in [root / '.scratch-runtime/m0-01/worker-handoff',
                  root / '.scratch-runtime/m0-01-remediation/worker-handoff',
                  root / '.scratch-runtime/coordinator-m001-review',
                  root / 'evidence/FE-BASE/runs/ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f',
                  root / 'evidence/M0-00/runs/b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61']:
    report['manifests'].append(manifest(directory))
assert report['manifests'][0]['sha256'] == 'cce987562f4541c21d4f7efc57f4a09037a2c5f59cfe1558fe593f136b4535ba'
assert sha((root / '.scratch-runtime/coordinator-m001-review/REVIEW.md').read_bytes()) == 'da764283db49f0cb108a0e096bf57508434f0582e39ea27a2686581c04096f8a'
assert command(['git', 'rev-parse', 'HEAD']) == candidate
assert command(['git', 'status', '--porcelain']) == ''
command(['git', 'merge-base', '--is-ancestor', criteria, candidate])
command(['git', 'merge-base', '--is-ancestor', 'efb0a5c6cf5e44eb9297d39ea88201a4610bf15e', base])
assert command(['git', 'merge-base', base, candidate]) == base
assert command(['git', 'rev-parse', base + '^{tree}']) == command(['git', 'rev-parse', 'efb0a5c6cf5e44eb9297d39ea88201a4610bf15e^{tree}'])
assert command(['git', 'diff', '--name-only', criteria, candidate, '--', 'evidence/M0-01']) == ''
report['files'] = {}
for name in command(['git', 'diff', '--name-only', base + '...' + candidate]).splitlines():
    content = subprocess.check_output(['git', 'show', candidate + ':' + name])
    assert (root / name).read_bytes() == content
    assert (clone / name).read_bytes() == content
    report['files'][name] = sha(content)
assert len(report['files']) == 33
assert command(['git', 'rev-parse', 'HEAD'], clone) == candidate
assert command(['git', 'status', '--porcelain'], clone) == ''
assert command(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], clone) == 'HEAD'
assert command(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], clone) == str(clone / '.git')
assert not (clone / '.git/objects/info/alternates').exists()
for name in ['frontend/node_modules', 'backend/.venv']:
    assert (clone / name).resolve().is_relative_to(clone)
    assert (root / name).stat().st_ino != (clone / name).stat().st_ino

report['runs'] = {}
for label, directory in [('main', output / 'main-01'),
                         ('clean', clone / '.scratch-runtime/coordinator-m001-rereview/clean-01'),
                         ('worker-main', root / '.scratch-runtime/m0-01-remediation/worker-handoff/main'),
                         ('worker-clean', root / '.scratch-runtime/m0-01-remediation/worker-handoff/clean')]:
    evidence = manifest(directory)
    results = json.loads((directory / 'results.json').read_text())
    assert results['tested_code_sha'] == candidate
    assert results['criteria_commit'] == criteria
    logs = json.loads((directory / 'commands.json').read_text())
    for item in logs:
        assert item['exit_code'] == item['expected_exit_code']
        for key in ['stdout', 'stderr']:
            assert sha(item[key].encode()) == item[key + '_sha256']
    assert sum(item['expected_exit_code'] == 1 for item in logs) == 2
    lifecycle = json.loads((directory / 'same-page-lifecycle.json').read_text())
    assert lifecycle['state'] == 'PASS'
    assert len(lifecycle['navigations']) == 1 and len(lifecycle['requests']) == 3
    assert len(lifecycle['steps']) == 3 and len(lifecycle['processes']) == 2
    assert len([item for item in lifecycle['responses'] if item['status'] == 200]) == 2
    assert all(item.get('stoppedAt') for item in lifecycle['processes'])
    for name in ['0.1.0', 'gt-lifecycle-api', 'api-a']:
        assert name not in lifecycle['steps'][1]['text']
    evidence.update(commands=len(logs), expected_exit_1=2, results=results,
                    lifecycle_sha256=sha((directory / 'same-page-lifecycle.json').read_bytes()))
    report['runs'][label] = evidence

for label in ['credentials-probe', 'credentials-clean-02']:
    data = json.loads((output / (label + '.json')).read_text())
    assert data['source_sha256'] == data['installed_sha256']
    assert [item['state'] for item in data['cases']] == ['PASS', 'PASS', 'FAIL', 'FAIL']
report['new_failure'] = {'criterion': 'M0-01-A05', 'inputs': ['http://@example.com', 'http://:@example.com'],
                         'expected': '非零退出', 'actual': '退出0', 'main_and_clean_reproduced': True}
report['final_required'] = {f'M0-01-A0{i}': 'FAIL' if i == 5 else 'PASS' for i in range(1, 6)}
report['final_environment'] = {'ports': command(['ss', '-ltnp']),
                                'containers': command(['docker', 'ps', '--format', '{{json .}}'])}
assert not report['final_environment']['containers']
for port in [5173, 4175, 8201, 8202, 8280, 8281]:
    assert f':{port} ' not in report['final_environment']['ports']
for name, path in [('uv', root / '.scratch-runtime/m0-01/discovery/uv-x86_64-unknown-linux-gnu/uv'),
                   ('chrome', Path('/home/lsy/.agent-browser/browsers/chrome-156.0.8078.80/chrome'))]:
    report[name] = {'path': str(path), 'sha256': sha(path.read_bytes())}

http = urllib.request.build_opener(urllib.request.ProxyHandler({}))
request = urllib.request.Request('http://127.0.0.1:3082/orchestrator/api/state', headers={'x-orchestrator-request': '1'})
with http.open(request, timeout=10) as response:
    state = json.load(response)
report['dsh_state_fields'] = sorted(state.keys())
report['dsh_health'] = state['health']
report['dsh_load'] = state['load']
report['dsh_paused'] = state['paused']
(output / 'independent-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'state': 'PASS', 'runs': {key: value['commands'] for key, value in report['runs'].items()},
                  'manifest_counts': [value['count'] for value in report['manifests']], 'required': report['final_required']}))
