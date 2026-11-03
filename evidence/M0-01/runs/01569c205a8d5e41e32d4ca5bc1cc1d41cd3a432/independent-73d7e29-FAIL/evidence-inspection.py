from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess

root = Path.cwd().resolve()
output = root / '.scratch-runtime/coordinator-m001-review'
os.environ.update(TMPDIR=str(output / 'env-tmp'), TMP=str(output / 'env-tmp'),
                  TEMP=str(output / 'env-tmp'), XDG_CACHE_HOME=str(output / 'cache'))
records = []


def command(argv):
    result = subprocess.run(argv, capture_output=True, text=True, check=False)
    record = {'argv': argv, 'cwd': str(root), 'at': datetime.now(timezone.utc).isoformat(),
              'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr}
    records.append(record)
    (output / 'inspection-commands.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    return result


for argv in [
    ['git', 'status', '--porcelain=v1'], ['git', 'rev-parse', 'HEAD'],
    ['git', 'rev-parse', '--abbrev-ref', 'HEAD'], ['git', 'remote', '-v'],
    ['git', 'merge-base', 'b8ad3150cf4480f8e205926541aeeccb072f7f80', '73d7e29cb2e837eceb4767932e116e76e4916d0f'],
    ['git', 'merge-base', '--is-ancestor', '18a9210947e0114a8bbc6a10c8864701dfb8539e', '73d7e29cb2e837eceb4767932e116e76e4916d0f'],
    ['git', 'merge-base', '--is-ancestor', 'efb0a5c6cf5e44eb9297d39ea88201a4610bf15e', 'b8ad3150cf4480f8e205926541aeeccb072f7f80'],
    ['git', 'rev-parse', 'b8ad3150cf4480f8e205926541aeeccb072f7f80^{tree}', 'efb0a5c6cf5e44eb9297d39ea88201a4610bf15e^{tree}', 'baseline/FE-BASE-ab07372aa223^{commit}'],
    ['git', 'log', '--format=fuller', 'b8ad3150cf4480f8e205926541aeeccb072f7f80..73d7e29cb2e837eceb4767932e116e76e4916d0f'],
    ['git', 'diff', '--name-status', 'b8ad3150cf4480f8e205926541aeeccb072f7f80...73d7e29cb2e837eceb4767932e116e76e4916d0f'],
    ['git', 'diff'], ['git', 'diff', '--cached'], ['ss', '-ltnp'],
    ['docker', 'ps', '--format', '{{json .}}'], ['docker', 'version'], ['docker', 'compose', 'version'],
    ['ps', '-eo', 'pid,ppid,args'],
    ['/home/lsy/.local/bin/gh-agent-bot', 'api', 'user', '--jq', '.login'],
    ['/home/lsy/.local/bin/gh-agent-bot', 'repo', 'view', 'shuyu-lin-dev/gas-turbine-lifecycle-lab', '--json', 'nameWithOwner,viewerPermission'],
    ['git', 'ls-remote', 'origin', 'refs/heads/main', 'refs/heads/agent/vue-python-runtime-810d967dfbff', 'refs/tags/baseline/FE-BASE-ab07372aa223'],
    ['sha256sum', '/home/lsy/.codex/AGENTS.md', str(root / 'AGENTS.md'), '/home/lsy/.codex/skills/code-review/SKILL.md', '/home/lsy/.codex/skills/agent-browser/SKILL.md'],
    [str(root / '.scratch-runtime/m0-01/discovery/uv-x86_64-unknown-linux-gnu/uv'), '--version'],
    ['/home/lsy/.agent-browser/browsers/chrome-156.0.8078.80/chrome', '--version'],
]:
    command(argv)

manifests = [root / '.scratch-runtime/m0-01/worker-handoff/SHA256SUMS.json',
             root / 'evidence/FE-BASE/runs/ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f/SHA256SUMS.json',
             root / 'evidence/M0-00/runs/b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61/SHA256SUMS.json']
checks = []
for manifest in manifests:
    rows = []
    for name, expected in json.loads(manifest.read_text()).items():
        target = manifest.parent / name
        actual = hashlib.sha256(target.read_bytes()).hexdigest()
        rows.append({'path': str(target), 'expected': expected, 'actual': actual, 'match': actual == expected})
    checks.append({'manifest': str(manifest), 'sha256': hashlib.sha256(manifest.read_bytes()).hexdigest(),
                   'count': len(rows), 'all_match': all(row['match'] for row in rows), 'files': rows})
(output / 'existing-evidence-hashes.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2) + '\n')
assert all(item['all_match'] for item in checks)

worker = root / '.scratch-runtime/m0-01/worker-handoff'
summaries = {}
for name in ['main', 'clean']:
    folder = worker / name
    commands = json.loads((folder / 'commands.json').read_text())
    for entry in commands:
        assert entry['exit_code'] == 0
        for channel in ['stdout', 'stderr']:
            assert hashlib.sha256(entry[channel].encode()).hexdigest() == entry[channel + '_sha256']
    summaries[name] = {'results': json.loads((folder / 'results.json').read_text()),
                       'commands': len(commands), 'all_command_hashes_match': True,
                       'processes': json.loads((folder / 'processes.json').read_text())}
(output / 'worker-evidence-audit.json').write_text(json.dumps(summaries, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'manifests': [{key: item[key] for key in ['manifest', 'count', 'all_match']} for item in checks],
                  'worker_commands': {name: value['commands'] for name, value in summaries.items()}}))
