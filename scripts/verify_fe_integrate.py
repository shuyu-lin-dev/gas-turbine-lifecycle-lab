import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request

from verify_m0_01 import Run, HTTP, ORIGIN

BASE = 'd4624599072312f86c65c12e77407b25e3005a3b'
S = '7bc1cb91d822560b32f804891798babeead68828'
FIXTURE_SHA = '8e099d47e6599ec3d3cce92df6931e1c22a2105aa2e5e232c8e751f4445f09a8'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description='FE-INTEGRATE真实窗口、完整viewer及独立部署验收')
    parser.add_argument('--criteria', required=True)
    parser.add_argument('--candidate', required=True)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--clean', action='store_true')
    args = parser.parse_args()
    root = Path.cwd().resolve()
    output = args.output.resolve()
    assert output.is_relative_to(root / '.scratch-runtime') and not output.exists()
    assert args.criteria == S and args.criteria != args.candidate
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip() == args.candidate
    assert subprocess.check_output(['git', 'status', '--porcelain']).decode().strip() == ''
    for variable in ['TMPDIR', 'TMP', 'TEMP', 'npm_config_cache', 'UV_CACHE_DIR']:
        assert Path(os.environ[variable]).resolve().is_relative_to(root / '.scratch-runtime'), variable
    output.mkdir(parents=True)
    run = Run(root, output)
    run.env['FE_BASE_CHROME'] = run.env['M0_01_CHROME']
    git = lambda *argv: run.command(['git', *argv])
    project = f'gtl-fei-{os.getpid()}'
    compose_env = {'API_INSTANCE_ID': 'api-a', 'WEB_PORT': '8280', 'API_PORT': '8281', 'API_CORS_ORIGINS': '[]'}
    compose = lambda *argv: run.command(['docker', 'compose', '-p', project, *argv], env=compose_env, timeout=1200)
    deployment_started = False
    try:
        git('merge-base', '--is-ancestor', S, args.candidate)
        assert git('merge-base', BASE, args.candidate) == BASE
        assert git('remote', 'get-url', 'origin') == ORIGIN
        assert digest((root / 'evidence/FE-INTEGRATE/bridge-fixture.json').read_bytes()) == FIXTURE_SHA
        assert git('diff', '--name-only', S, args.candidate, '--', 'evidence/FE-INTEGRATE') == ''
        preserved = ['backend', 'assets', 'evidence/M0-00', 'evidence/FE-BASE', 'evidence/M0-01',
                     'scripts/fe-base', 'scripts/verify_fe_base.py', 'scripts/verify_m0_01.py',
                     'scripts/verify_m0_00.py', 'scripts/check_m0_00_failures.py', 'ACCEPTANCE.md', 'LICENSE',
                     'vendor/turbine-explorer/LICENSE', 'vendor/turbine-explorer/THIRD_PARTY_NOTICES.md',
                     'vendor/turbine-explorer/package-lock.json', 'vendor/turbine-explorer/public']
        assert git('diff', '--name-only', BASE, args.candidate, '--', *preserved) == ''
        manifests = {}
        for task, candidate in [('M0-00', 'b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61'),
                                ('FE-BASE', 'ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f'),
                                ('M0-01', '01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432')]:
            directory = root / f'evidence/{task}/runs/{candidate}'
            manifest = json.loads((directory / 'SHA256SUMS.json').read_text())
            for name, expected in manifest.items():
                assert digest((directory / name).read_bytes()) == expected, name
            manifests[task] = {'entries': len(manifest), 'sha256': digest((directory / 'SHA256SUMS.json').read_bytes())}
        run.save('preservation.json', {'paths': preserved, 'manifests': manifests, 'state': 'PASS'})
        if args.clean:
            assert root.name.startswith('clean-') and '.scratch-runtime' in root.parts
            assert git('rev-parse', '--abbrev-ref', 'HEAD') == 'HEAD'
            assert Path(git('rev-parse', '--path-format=absolute', '--git-common-dir')) == root / '.git'
        else:
            request = urllib.request.Request('http://127.0.0.1:3082/orchestrator/api/settings', headers={'x-orchestrator-request': '1'})
            with HTTP.open(request) as response:
                settings = json.load(response)
            initial = json.loads((root / 'evidence/M0-00/initial-fingerprints.json').read_text())
            canonical = lambda value: digest(json.dumps(value, sort_keys=True, ensure_ascii=False).encode())
            blocks = {key: {'revision': item['revision'], 'value_sha256': canonical(item['value'])} for key, item in settings['blocks'].items()}
            sources = {item['id']: {'revision': item['revision'], 'value_sha256': canonical(item['value'])} for item in settings['sources']}
            assert blocks == initial['blocks'] and sources == initial['sources']
            run.save('dsh-regression.json', {'blocks': blocks, 'sources': sources})
        assert run.command(['gh', 'api', 'user', '--jq', '.login']) == 'lucy-assistant'
        repository = json.loads(run.command(['gh', 'repo', 'view', 'shuyu-lin-dev/gas-turbine-lifecycle-lab', '--json', 'nameWithOwner,viewerPermission']))
        assert repository['viewerPermission'] == 'WRITE'
        run.save('github.json', repository)
        for name, command in [('node', ['node', '--version']), ('npm', ['npm', '--version']), ('python', ['python3', '--version']),
                              ('uv', [run.uv, '--version']), ('docker', ['docker', 'version']), ('compose', ['docker', 'compose', 'version'])]:
            run.save(f'{name}-version.json', {'output': run.command(command)})
        vendor = root / 'vendor/turbine-explorer'
        run.command(['npm', 'ci'], cwd=vendor)
        for command in [['npm', 'test'], ['npm', 'run', 'build'], ['npm', 'run', 'build:labs']]:
            run.command(command, cwd=vendor)
        run.local()
        run.containers()
        run.command(['node', '--experimental-strip-types', '--test', 'frontend/tests/protocol.test.ts'])
        run.command(['npm', 'ci'], cwd=root / 'scripts/fe-base')
        api = run.api('api-a', 8201, root / 'backend/.venv/bin/python')
        viewer = run.start('viewer-dev', ['node', 'node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--base=/viewer/', '--port', '4177', '--strictPort'], cwd=vendor)
        run.wait('http://127.0.0.1:4177/viewer/', viewer)
        web = run.web('web-bridge', '/api/v1')
        for script, name in [('bridge.mjs', 'development-bridge'), ('bridge-initialization.mjs', 'development-initialization')]:
            run.command(['node', root / 'frontend/tests' / script, 'http://127.0.0.1:5173', output / f'{name}.json'], timeout=1200)
        run.command(['node', 'scripts/fe-base/browser.mjs', 'http://127.0.0.1:5173/viewer', output / 'development-upstream.json'], timeout=1200)
        run.stop(web)
        run.stop(viewer)
        run.stop(api)
        compose('build')
        deployment_started = True
        compose('up', '-d', 'web', 'api')
        run.wait('http://127.0.0.1:8280')
        run.wait('http://127.0.0.1:8281/api/v1/health')
        routes = {}
        for name, path, code in [('viewer-slash', '/viewer/', 200), ('viewer-redirect', '/viewer', 200),
                                 ('viewer-index', '/viewer/index.html', 200), ('missing-viewer-resource', '/viewer/assets/missing.js', 404),
                                 ('missing-root-resource', '/assets/missing.js', 404)]:
            routes[name] = run.http('http://127.0.0.1:8280' + path, code)
        assert all('id="scene"' in routes[name]['body'] for name in ['viewer-slash', 'viewer-redirect', 'viewer-index'])
        run.save('deployment-routes.json', routes)
        for script, name in [('bridge.mjs', 'deployment-bridge'), ('bridge-initialization.mjs', 'deployment-initialization')]:
            run.command(['node', root / 'frontend/tests' / script, 'http://127.0.0.1:8280', output / f'{name}.json'], timeout=1200)
        run.command(['node', 'scripts/fe-base/browser.mjs', 'http://127.0.0.1:8280/viewer', output / 'deployment-upstream.json'], timeout=1200)
        git('diff', '--check', BASE, args.candidate)
        assert git('status', '--porcelain') == ''
        run.save('results.json', {'criteria_commit': S, 'tested_code_sha': args.candidate, 'comparison_base': BASE,
                                'merge_base': BASE, 'clean': args.clean, 'fixture_sha256': FIXTURE_SHA,
                                'required': {f'FE-INTEGRATE-A0{index}': 'PASS' for index in range(1, 7)},
                                'regressions': {'M0-01': 'PASS', 'FE-BASE': 'PASS'}, 'commands': len(run.commands),
                                'at': datetime.now(timezone.utc).isoformat()})
    finally:
        if deployment_started:
            compose('logs', '--no-color')
            compose('down')
        for process, record, log in run.processes:
            if process.poll() is None:
                run.stop(process)
        run.save('SHA256SUMS.json', {str(path.relative_to(output)): digest(path.read_bytes()) for path in sorted(output.iterdir()) if path.is_file() and path.name != 'SHA256SUMS.json'})
    print(json.dumps({'state': 'PASS', 'candidate': args.candidate, 'output': str(output)}))


if __name__ == '__main__':
    main()
