import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import urllib.error
import urllib.request

BASE = 'b8ad3150cf4480f8e205926541aeeccb072f7f80'
S = '18a9210947e0114a8bbc6a10c8864701dfb8539e'
ORIGIN = 'https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git'
HTTP = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def digest(data):
    return hashlib.sha256(data).hexdigest()


class Run:
    def __init__(self, root, output):
        self.root = root
        self.output = output
        self.commands = []
        self.processes = []
        self.env = dict(os.environ)
        self.uv = self.env.get('M0_01_UV') or shutil.which('uv')
        assert self.uv and Path(self.uv).is_file(), '需要M0_01_UV或已安装uv'
        assert self.env.get('M0_01_CHROME'), '需要M0_01_CHROME'
        assert Path(self.env['TMPDIR']).resolve().is_relative_to(root / '.scratch-runtime')

    def save(self, name, value):
        (self.output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

    def command(self, argv, cwd=None, env=None, timeout=600, expected=0):
        record = {'argv': [str(value) for value in argv], 'cwd': str(cwd or self.root),
                  'at': datetime.now(timezone.utc).isoformat(), 'exit_code': None, 'expected_exit_code': expected}
        self.commands.append(record)
        self.save('commands.json', self.commands)
        try:
            result = subprocess.run(record['argv'], cwd=record['cwd'], env=self.env | (env or {}),
                                    capture_output=True, timeout=timeout)
            record.update(exit_code=result.returncode, stdout=result.stdout.decode(), stderr=result.stderr.decode(),
                          stdout_sha256=digest(result.stdout), stderr_sha256=digest(result.stderr))
            assert result.returncode == expected, f'命令失败: {argv}; {record["stderr"]}'
            return result.stdout.decode().strip()
        finally:
            self.save('commands.json', self.commands)

    def start(self, name, argv, cwd=None, env=None):
        log = (self.output / f'{name}.log').open('w')
        process = subprocess.Popen([str(value) for value in argv], cwd=cwd or self.root,
                                   env=self.env | (env or {}), stdout=log, stderr=subprocess.STDOUT,
                                   start_new_session=True)
        record = {'name': name, 'argv': [str(value) for value in argv], 'pid': process.pid,
                  'cwd': str(cwd or self.root), 'started_at': datetime.now(timezone.utc).isoformat()}
        self.processes.append((process, record, log))
        self.save('processes.json', [item[1] for item in self.processes])
        return process

    def stop(self, process):
        import signal
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=15)
        for item, record, log in self.processes:
            if item is process:
                record.update(exit_code=process.returncode, stopped_at=datetime.now(timezone.utc).isoformat())
                log.close()
        self.save('processes.json', [item[1] for item in self.processes])

    def http(self, url, expected=200):
        try:
            with HTTP.open(url, timeout=5) as response:
                data = {'url': url, 'status': response.status, 'headers': dict(response.headers), 'body': response.read().decode()}
        except urllib.error.HTTPError as error:
            data = {'url': url, 'status': error.code, 'body': error.read().decode()}
        assert data['status'] == expected, data
        return data

    def wait(self, url, process=None):
        deadline = time.monotonic() + 30
        while True:
            if process:
                assert process.poll() is None, '进程提前退出'
            try:
                return self.http(url)
            except (urllib.error.URLError, ConnectionError, TimeoutError, AssertionError):
                if time.monotonic() >= deadline:
                    raise
                time.sleep(.1)

    def browser(self, name, page, health, instance='api-a', mode='healthy'):
        self.command(['npm', 'test', '--', page, health, instance, self.output / f'{name}.json', mode], cwd=self.root / 'frontend', timeout=120)

    def api(self, name, port, python):
        process = self.start(name, [python, '-m', 'uvicorn', 'gt_lifecycle_api.app:app', '--host', '127.0.0.1', '--port', str(port)],
                             env={'API_INSTANCE_ID': name, 'API_CORS_ORIGINS': '["http://127.0.0.1:5173", "http://127.0.0.1:4175"]'})
        data = self.wait(f'http://127.0.0.1:{port}/api/v1/health', process)
        expected = json.loads((self.root / f'evidence/M0-01/health-{name}.json').read_text())
        assert json.loads(data['body']) == expected
        self.save(f'{name}-{port}-http.json', data)
        return process

    def web(self, name, base):
        process = self.start(name, ['node', 'node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
                             cwd=self.root / 'frontend', env={'VITE_API_BASE_URL': base, 'API_PROXY_TARGET': 'http://127.0.0.1:8201'})
        self.wait('http://127.0.0.1:5173', process)
        return process

    def local(self):
        front = self.root / 'frontend'
        back = self.root / 'backend'
        self.command(['npm', 'ci'], cwd=front)
        self.command(['npm', 'ls', '--all', '--json'], cwd=front)
        self.command(['npm', 'run', 'build'], cwd=front)
        self.command([self.uv, 'sync', '--locked'], cwd=back)
        self.command([self.uv, 'run', '--locked', 'pytest', '-q'], cwd=back)
        self.command([self.uv, 'build'], cwd=back)
        requirements = self.command([self.uv, 'export', '--locked', '--no-dev', '--no-emit-project', '--format', 'requirements-txt'], cwd=back)
        (self.output / 'wheel-requirements.txt').write_text(requirements + '\n')
        wheel_env = self.output / 'wheel-env'
        self.command([self.uv, 'venv', '--python', '3.12', wheel_env])
        python = wheel_env / 'bin/python'
        self.command([self.uv, 'pip', 'sync', '--python', python, '--require-hashes', self.output / 'wheel-requirements.txt'])
        wheels = list((back / 'dist').glob('*.whl'))
        assert len(wheels) == 1
        self.command([self.uv, 'pip', 'install', '--python', python, '--no-deps', wheels[0]])
        configuration_cases = json.loads((back / 'tests/configuration_cases.json').read_text())
        for name, value, expected in configuration_cases:
            self.command([python, '-B', '-c', 'import gt_lifecycle_api.app'],
                         env={'API_INSTANCE_ID': 'api-a', 'API_CORS_ORIGINS': '[]', name: value}, expected=expected)
        api_a = self.api('api-a', 8201, python)
        api_b = self.api('api-b', 8202, python)
        web = self.web('web-direct-a', 'http://127.0.0.1:8201/api/v1')
        self.browser('direct-a', 'http://127.0.0.1:5173', 'http://127.0.0.1:8201/api/v1/health')
        self.stop(web)
        self.save('web-stopped-api-alive.json', self.http('http://127.0.0.1:8201/api/v1/health'))
        web = self.web('web-direct-b', 'http://127.0.0.1:8202/api/v1')
        self.browser('direct-b', 'http://127.0.0.1:5173', 'http://127.0.0.1:8202/api/v1/health', 'api-b')
        self.stop(web)
        web = self.web('web-proxy', '/api/v1')
        self.browser('dev-proxy', 'http://127.0.0.1:5173', 'http://127.0.0.1:5173/api/v1/health')
        self.stop(api_a)
        self.browser('api-stopped', 'http://127.0.0.1:5173', 'http://127.0.0.1:5173/api/v1/health', mode='failed')
        api_a = self.api('api-a', 8201, python)
        self.browser('api-recovered', 'http://127.0.0.1:5173', 'http://127.0.0.1:5173/api/v1/health')
        self.stop(web)
        for index, value in enumerate(['file:///invalid', 'http://user:password@127.0.0.1:8201/api/v1', '',
                                       r'/\127.0.0.1:8202/api/v1', '/api/\nv1',
                                       'http://127.0.0.1:8201/api/v1?', 'http://127.0.0.1:8201/api/v1#',
                                       '/api/v1?', '/api/v1#']):
            web = self.web(f'web-invalid-{index}', value)
            self.browser(f'invalid-address-{index}', 'http://127.0.0.1:5173', 'http://127.0.0.1:8201/api/v1/health', mode='config')
            self.stop(web)
        preview = self.start('web-preview', ['node', 'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], cwd=front)
        self.wait('http://127.0.0.1:4175', preview)
        self.browser('built-preview', 'http://127.0.0.1:4175', 'http://127.0.0.1:4175/api/v1/health')
        self.stop(preview)
        self.stop(api_a)
        web = self.web('web-lifecycle', '/api/v1')
        self.command(['npm', 'run', 'test:lifecycle', '--', 'http://127.0.0.1:5173',
                      'http://127.0.0.1:5173/api/v1/health', 'api-a',
                      self.output / 'same-page-lifecycle.json', python, '8201'], cwd=front, timeout=120)
        self.stop(web)
        self.stop(api_b)

    def containers(self):
        project = f'gtl-m001-{os.getpid()}'
        command = ['docker', 'compose', '-p', project]
        env = {'API_INSTANCE_ID': 'api-a', 'WEB_PORT': '8280', 'API_PORT': '8281', 'API_UPSTREAM': 'http://api:8000', 'API_CORS_ORIGINS': '[]'}
        compose = lambda *args: self.command([*command, *args], env=env, timeout=1200)
        try:
            config = json.loads(compose('config', '--format', 'json'))
            assert set(config['services']) == {'web', 'api'}
            assert all(not item.get('depends_on') for item in config['services'].values())
            self.save('compose-config.json', config)
            compose('build')
            compose('up', '-d', 'web')
            self.wait('http://127.0.0.1:8280')
            self.browser('container-web-alone', 'http://127.0.0.1:8280', 'http://127.0.0.1:8280/api/v1/health', mode='failed')
            compose('up', '-d', 'api')
            data = self.wait('http://127.0.0.1:8281/api/v1/health')
            assert json.loads(data['body']) == json.loads((self.root / 'evidence/M0-01/health-api-a.json').read_text())
            self.save('container-api-http.json', data)
            self.browser('container-healthy', 'http://127.0.0.1:8280', 'http://127.0.0.1:8280/api/v1/health')
            self.save('deployment-routes.json', {name: self.http(url, code) for name, url, code in [
                ('refresh', 'http://127.0.0.1:8280/service/connection', 200),
                ('missing-static', 'http://127.0.0.1:8280/assets/missing.js', 404),
                ('api-root', 'http://127.0.0.1:8281/', 404),
                ('api-index', 'http://127.0.0.1:8281/index.html', 404)]})
            compose('stop', 'web')
            self.save('container-web-stopped.json', self.http('http://127.0.0.1:8281/api/v1/health'))
            compose('start', 'web')
            self.wait('http://127.0.0.1:8280')
            compose('pause', 'api')
            try:
                self.browser('container-api-timeout', 'http://127.0.0.1:8280', 'http://127.0.0.1:8280/api/v1/health', mode='timeout')
            finally:
                compose('unpause', 'api')
            compose('stop', 'api')
            self.browser('container-api-stopped', 'http://127.0.0.1:8280', 'http://127.0.0.1:8280/api/v1/health', mode='failed')
            compose('start', 'api')
            self.wait('http://127.0.0.1:8281/api/v1/health')
            self.browser('container-api-recovered', 'http://127.0.0.1:8280', 'http://127.0.0.1:8280/api/v1/health')
            compose('exec', '-T', 'api', '.venv/bin/python', '-c',
                    'from pathlib import Path; assert not Path("/app/frontend").exists(); assert not Path("/app/dist/index.html").exists(); from importlib.metadata import version; print(version("gt-lifecycle-api"))')
            self.save('containers.json', {'ps': compose('ps', '--format', 'json'), 'images': compose('images', '--format', 'json')})
        finally:
            compose('logs', '--no-color')
            compose('down')


def main():
    parser = argparse.ArgumentParser(description='M0-01真实运行、浏览器和容器验收')
    parser.add_argument('--criteria', required=True)
    parser.add_argument('--candidate', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--clean', action='store_true')
    args = parser.parse_args()
    root = Path.cwd().resolve()
    output = args.output.resolve()
    assert output.is_relative_to(root / '.scratch-runtime') and not output.exists()
    assert args.criteria == S and args.criteria != args.candidate
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip() == args.candidate
    assert subprocess.check_output(['git', 'status', '--porcelain']).decode().strip() == ''
    output.mkdir(parents=True)
    run = Run(root, output)
    git = lambda *argv: run.command(['git', *argv])
    try:
        git('merge-base', '--is-ancestor', S, args.candidate)
        assert git('merge-base', BASE, args.candidate) == BASE
        assert git('remote', 'get-url', 'origin') == ORIGIN
        if args.clean:
            assert root.name.startswith('clean-') and '.scratch-runtime' in root.parts
            assert git('rev-parse', '--abbrev-ref', 'HEAD') == 'HEAD'
            assert Path(git('rev-parse', '--path-format=absolute', '--git-common-dir')) == root / '.git'
        preserved = ['vendor', 'assets', 'evidence/FE-BASE', 'evidence/M0-00', 'scripts/fe-base',
                     'scripts/verify_fe_base.py', 'scripts/verify_m0_00.py', 'scripts/check_m0_00_failures.py', 'ACCEPTANCE.md', 'LICENSE']
        assert git('diff', '--name-only', BASE, args.candidate, '--', *preserved) == ''
        assert git('diff', '--name-only', S, args.candidate, '--', 'evidence/M0-01') == ''
        for task, candidate in [('FE-BASE', 'ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f'), ('M0-00', 'b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61')]:
            directory = root / f'evidence/{task}/runs/{candidate}'
            for name, expected in json.loads((directory / 'SHA256SUMS.json').read_text()).items():
                assert digest((directory / name).read_bytes()) == expected
        run.save('regression-preservation.json', {'paths': preserved, 'state': 'PASS'})
        for name, command in [('uv', [run.uv, '--version']), ('node', ['node', '--version']), ('npm', ['npm', '--version']),
                              ('docker', ['docker', 'version']), ('compose', ['docker', 'compose', 'version'])]:
            run.save(f'{name}-version.json', {'output': run.command(command)})
        assert run.command(['gh', 'api', 'user', '--jq', '.login']) == 'lucy-assistant'
        run.save('github.json', json.loads(run.command(['gh', 'repo', 'view', 'shuyu-lin-dev/gas-turbine-lifecycle-lab', '--json', 'nameWithOwner,viewerPermission'])))
        if not args.clean:
            request = urllib.request.Request('http://127.0.0.1:3082/orchestrator/api/settings', headers={'x-orchestrator-request': '1'})
            with HTTP.open(request) as response:
                settings = json.load(response)
            initial = json.loads((root / 'evidence/M0-00/initial-fingerprints.json').read_text())
            canonical = lambda value: digest(json.dumps(value, sort_keys=True, ensure_ascii=False).encode())
            blocks = {key: {'revision': item['revision'], 'value_sha256': canonical(item['value'])} for key, item in settings['blocks'].items()}
            sources = {item['id']: {'revision': item['revision'], 'value_sha256': canonical(item['value'])} for item in settings['sources']}
            assert blocks == initial['blocks'] and sources == initial['sources']
            run.save('configuration-regression.json', {'blocks': blocks, 'sources': sources})
        run.local()
        run.containers()
        vendor = root / 'vendor/turbine-explorer'
        for command in [['npm', 'ci'], ['npm', 'test'], ['npm', 'run', 'build'], ['npm', 'run', 'build:labs']]:
            run.command(command, cwd=vendor)
        git('diff', '--check', S, args.candidate)
        assert git('status', '--porcelain') == ''
        run.save('results.json', {'criteria_commit': S, 'tested_code_sha': args.candidate, 'comparison_base': BASE,
                                'clean': args.clean, 'required': {f'M0-01-A0{index}': 'PASS' for index in range(1, 6)},
                                'commands': len(run.commands)})
    finally:
        for process, record, log in run.processes:
            if process.poll() is None:
                run.stop(process)
        run.save('SHA256SUMS.json', {str(path.relative_to(output)): digest(path.read_bytes()) for path in sorted(output.iterdir()) if path.is_file() and path.name != 'SHA256SUMS.json'})
    print(json.dumps({'state': 'PASS', 'candidate': args.candidate, 'output': str(output)}))


if __name__ == '__main__':
    main()
