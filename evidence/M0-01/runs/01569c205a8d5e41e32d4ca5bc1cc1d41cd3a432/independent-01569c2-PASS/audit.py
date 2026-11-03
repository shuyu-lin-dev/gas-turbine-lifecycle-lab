from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request

root = Path.cwd().resolve()
out = root / '.scratch-runtime/coordinator-m001-origin-review'
clean = out / 'clean-01569c2'
candidate = '01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432'
criteria = '18a9210947e0114a8bbc6a10c8864701dfb8539e'
base = 'b8ad3150cf4480f8e205926541aeeccb072f7f80'
report = {'at': datetime.now(timezone.utc).isoformat(), 'candidate': candidate, 'checks': []}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read(path):
    return json.loads(path.read_text())


def save():
    (out / 'audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


def check(name, condition, facts):
    report['checks'].append({'name': name, 'state': 'PASS' if condition else 'FAIL', 'facts': facts})
    save()
    assert condition, name


def command(argv, cwd=root):
    result = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=30)
    check('command', result.returncode == 0, {'argv': argv, 'cwd': str(cwd), 'exit_code': result.returncode,
                                            'stdout': result.stdout, 'stderr': result.stderr})
    return result.stdout.strip()


def manifest(directory, recursive):
    path = directory / 'SHA256SUMS.json'
    mapping = read(path)
    actual = {str(item.relative_to(directory)) for item in (directory.rglob('*') if recursive else directory.iterdir())
              if item.is_file() and item != path}
    for name, expected in mapping.items():
        assert (directory / name).resolve().is_relative_to(directory.resolve())
        assert sha((directory / name).read_bytes()) == expected, (directory, name)
    check('manifest', actual == set(mapping), {'directory': str(directory), 'files': len(mapping),
          'manifest_sha256': sha(path.read_bytes()), 'missing': sorted(set(mapping) - actual),
          'unlisted': sorted(actual - set(mapping))})


check('HEAD', command(['git', 'rev-parse', 'HEAD']) == candidate, {'expected': candidate})
check('worktree', command(['git', 'status', '--porcelain']) == '', {})
check('merge-base', command(['git', 'merge-base', base, candidate]) == base, {'expected': base})
command(['git', 'merge-base', '--is-ancestor', criteria, candidate])
command(['git', 'merge-base', '--is-ancestor', 'efb0a5c6cf5e44eb9297d39ea88201a4610bf15e', candidate])
for directory in [root, clean]:
    check('candidate-checkout', command(['git', 'rev-parse', 'HEAD'], directory) == candidate, {'directory': str(directory)})
    check('candidate-clean', command(['git', 'status', '--porcelain'], directory) == '', {'directory': str(directory)})
    check('origin', command(['git', 'remote', 'get-url', 'origin'], directory) ==
          'https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git', {'directory': str(directory)})
check('clone-detached', command(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], clean) == 'HEAD', {})
check('clone-independent-git', command(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], clean) == str(clean / '.git'), {})
for name in ['frontend/node_modules', 'backend/.venv', 'vendor/turbine-explorer/node_modules']:
    path = clean / name
    check('independent-dependencies', path.is_dir() and not path.is_symlink() and path.resolve().is_relative_to(clean), {'path': str(path)})

mapping = read(root / 'evidence/M0-00/preparation/20261103T142014+0800/migration-map.json')
assets = [item for item in mapping['mappings'] if item['destination'].startswith('assets/')]
assert len(assets) == 16
for directory in [root, clean]:
    for item in assets:
        data = (directory / item['destination']).read_bytes()
        assert sha(data) == item['source_sha256'] and len(data) == item['source_bytes']
check('preserved-assets', True, {'count': len(assets), 'copies': 2})
check('vendor-tree', command(['git', 'rev-parse', candidate + ':vendor/turbine-explorer']) ==
      'fc5ac885bdb2bc8272ab77d74473a46e4b5da45c', {})
check('subtree-import', command(['git', 'rev-parse', '459a359afd4e2e2bdaca05acccc4b65f79b741d8:vendor/turbine-explorer']) ==
      '03487ef57f6bc957dfc83b890de1f1e700ed2841', {})
command(['git', 'show', '-s', '--format=%B', '459a359afd4e2e2bdaca05acccc4b65f79b741d8'])

worker = root / '.scratch-runtime/m0-01-origin-structure/worker-handoff'
manifest(worker, True)
cases = read(root / 'backend/tests/configuration_cases.json')
check('configuration-fixture', len(cases) == 58 and sha((root / 'backend/tests/configuration_cases.json').read_bytes()) ==
      '55f6b488aac84a531a6aac7c3caaa033aab1c8e7059ba2754828ca44dd79fa34', {'cases': cases})
independent = clean / '.scratch-runtime/coordinator-m001-origin-review/frozen-clean'
for label, directory, count in [('worker-main', worker / 'main', 122), ('worker-clean', worker / 'clean', 124),
                                 ('independent-clean', independent, 124)]:
    result = read(directory / 'results.json')
    commands = read(directory / 'commands.json')
    assert result['tested_code_sha'] == candidate and result['criteria_commit'] == criteria
    assert result['comparison_base'] == base and all(value == 'PASS' for value in result['required'].values())
    assert len(result['required']) == 5 and len(commands) == count
    for item in commands:
        assert item['exit_code'] == item['expected_exit_code'], item
        for stream in ['stdout', 'stderr']:
            assert sha(item[stream].encode()) == item[stream + '_sha256']
    wheel = [item for item in commands if item['argv'][-1:] == ['import gt_lifecycle_api.app']]
    assert len(wheel) == 58
    assert [item['expected_exit_code'] for item in wheel] == [case[2] for case in cases]
    assert all(item['argv'][0].endswith('/wheel-env/bin/python') for item in wheel)
    lifecycle = read(directory / 'same-page-lifecycle.json')
    assert lifecycle['state'] == 'PASS' and len(lifecycle['navigations']) == 1 and len(lifecycle['requests']) == 3
    assert sorted(item['status'] for item in lifecycle['responses']) == [200, 200, 502]
    assert len(lifecycle['processes']) == 2 and all('stoppedAt' in item for item in lifecycle['processes'])
    for index in range(9):
        invalid = read(directory / f'invalid-address-{index}.json')
        assert invalid['state'] == 'PASS' and invalid['requests'] == [] and invalid['responses'] == []
    for name in ['api-a-8201-http', 'api-b-8202-http', 'container-api-http']:
        response = read(directory / f'{name}.json')
        expected = read(root / ('evidence/M0-01/health-api-b.json' if name.startswith('api-b') else 'evidence/M0-01/health-api-a.json'))
        assert response['status'] == 200 and json.loads(response['body']) == expected
    check('run-artifacts', True, {'label': label, 'directory': str(directory), 'required': result['required'],
          'commands': len(commands), 'exits': dict(Counter(item['exit_code'] for item in commands)),
          'pytest': [item['stdout'] for item in commands if 'pytest' in item['argv']],
          'commands_sha256': sha((directory / 'commands.json').read_bytes()),
          'lifecycle_sha256': sha((directory / 'same-page-lifecycle.json').read_bytes())})
    if label == 'independent-clean':
        manifest(directory, False)

initial = read(root / 'evidence/M0-00/initial-fingerprints.json')
http = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def get(name):
    request = urllib.request.Request('http://127.0.0.1:3082/orchestrator/api/' + name,
                                     headers={'x-orchestrator-request': '1'})
    with http.open(request, timeout=10) as response:
        assert response.status == 200
        return json.load(response)


def canonical(value):
    return sha(json.dumps(value, sort_keys=True, ensure_ascii=False).encode())


settings, state, prompts = get('settings'), get('state'), get('prompts')
blocks = {key: {'revision': item['revision'], 'value_sha256': canonical(item['value'])} for key, item in settings['blocks'].items()}
sources = {item['id']: {'revision': item['revision'], 'value_sha256': canonical(item['value'])} for item in settings['sources']}
check('dsh-settings', blocks == initial['blocks'] and sources == initial['sources'], {'blocks': blocks, 'sources': sources})
check('dsh-prompts', prompts['current']['revision'] == initial['prompts']['revision'] and
      canonical(prompts['current']['config']) == initial['prompts']['config_sha256'], {'revision': prompts['current']['revision']})
for item in initial['files']:
    assert sha(Path(item['path']).read_bytes()) == item['sha256']
check('dsh-profile-files', True, {'count': len(initial['files'])})
check('dsh-ready', state['health']['runtime']['state'] == 'ready', {'runtime': state['health']['runtime'], 'load': state['load']})
check('dsh-single-worker', state['load']['maxWorkers'] == 1 and state['load']['running'] <= 1 and state['load']['queued'] == 0, {})
check('dsh-target', state['setup']['accounts']['repository'] == 'shuyu-lin-dev/gas-turbine-lifecycle-lab' and
      state['setup']['accounts']['agent'] == 'lucy-assistant', {'repository': state['setup']['accounts']['repository'], 'agent': state['setup']['accounts']['agent']})
for name in ['frontend-query-red/empty-query.json', 'old-c-red.log', 'red.log']:
    check('preserved-failure', (worker / name).is_file(), {'path': str(worker / name), 'sha256': sha((worker / name).read_bytes())})
old = root / '.scratch-runtime/coordinator-m001-rereview/REVIEW.md'
check('original-independent-report', sha(old.read_bytes()) == '0b056850eb647c884434092399aa2f339c287c67b0d8365cbfef90c573053e16', {})
report['state'] = 'PASS'
save()
print(json.dumps({'state': report['state'], 'checks': len(report['checks'])}))
