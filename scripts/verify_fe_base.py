import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import time
import urllib.error
import urllib.request

BASE = '86e521184a4d5bbd42dfe93a48999fa714c233f2'
IMPORT = '459a359afd4e2e2bdaca05acccc4b65f79b741d8'
UPSTREAM = 'efc5d2ecd12055f880a41b47215791c22d3656d4'
TREE = '03487ef57f6bc957dfc83b890de1f1e700ed2841'
ORIGIN = 'https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git'
S = '7704387252b293bee1ec671b440164a12287ca16'


def sha(data):
    return hashlib.sha256(data).hexdigest()


class Run:
    def __init__(self, root, output):
        self.root = root
        self.output = output
        self.commands = []
        self.env = dict(os.environ)
        assert self.env.get('TMPDIR') and Path(self.env['TMPDIR']).resolve().is_relative_to(root / '.scratch-runtime')
        assert self.env.get('FE_BASE_CHROME'), '需要 FE_BASE_CHROME'

    def save(self, name, value):
        (self.output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

    def run(self, argv, cwd=None, timeout=120, expected=0):
        cwd = cwd or self.root
        record = {'argv': [str(value) for value in argv], 'cwd': str(cwd),
                  'at': datetime.now(timezone.utc).isoformat(), 'exit_code': None}
        self.commands.append(record)
        self.save('commands.json', self.commands)
        try:
            result = subprocess.run(record['argv'], cwd=cwd, env=self.env, capture_output=True, timeout=timeout)
            record.update(exit_code=result.returncode, stdout=result.stdout.decode(), stderr=result.stderr.decode(),
                          stdout_sha256=sha(result.stdout), stderr_sha256=sha(result.stderr))
            assert result.returncode == expected, f'命令退出{result.returncode}: {argv}'
            return result.stdout.decode().strip()
        finally:
            self.save('commands.json', self.commands)

    def git(self, *args, cwd=None):
        return self.run(['git', *args], cwd=cwd)

    def baseline(self, directory, prefix):
        for name, command in [('install', ['npm', 'ci']), ('test', ['npm', 'test']),
                              ('build', ['npm', 'run', 'build']), ('build-labs', ['npm', 'run', 'build:labs'])]:
            self.run(command, cwd=directory, timeout=600)
        dependencies = json.loads(self.run(['npm', 'ls', '--all', '--json'], cwd=directory))
        self.save(prefix + '-dependencies.json', dependencies)
        lock = json.loads((directory / 'package-lock.json').read_text())
        packages = []
        for name, metadata in lock['packages'].items():
            if not name:
                continue
            package_path = directory / name / 'package.json'
            if not package_path.exists():
                assert metadata.get('optional') is True, f'缺少必要依赖: {name}'
                packages.append({'path': name, 'version': metadata['version'], 'installed': False, 'optional': True})
                continue
            installed = json.loads(package_path.read_text())
            assert installed['version'] == metadata['version']
            packages.append({'path': name, 'version': installed['version'], 'license': installed.get('license'), 'installed': True})
        self.save(prefix + '-licenses.json', packages)

    def browser(self, directory, port, name):
        log_path = self.output / (name + '-server.log')
        argv = ['node', str(directory / 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1',
                '--port', str(port), '--strictPort']
        record = {'argv': argv, 'cwd': str(directory), 'port': port, 'started_at': datetime.now(timezone.utc).isoformat()}
        with log_path.open('w') as log:
            server = subprocess.Popen(argv, cwd=directory, env=self.env, stdout=log, stderr=subprocess.STDOUT)
            record['pid'] = server.pid
            self.save(name + '-server.json', record)
            try:
                deadline = time.monotonic() + 30
                # 启动探针只处理尚未监听的连接错误，浏览器与命令失败继续抛出。
                while True:
                    assert server.poll() is None, '预览服务启动失败'
                    try:
                        with urllib.request.urlopen(f'http://127.0.0.1:{port}/', timeout=1) as response:
                            assert response.status == 200
                            break
                    except urllib.error.URLError:
                        if time.monotonic() >= deadline:
                            raise
                        time.sleep(.1)
                self.run(['node', 'scripts/fe-base/browser.mjs', f'http://127.0.0.1:{port}',
                          str(self.output / (name + '-browser.json'))], timeout=1200)
                try:
                    with urllib.request.urlopen(f'http://127.0.0.1:{port}/not-present-fe-base.js') as response:
                        content_type = response.headers['Content-Type']
                        assert response.status != 200 or 'javascript' not in content_type
                        self.save(name + '-missing-resource.json', {'status': response.status, 'content_type': content_type,
                                                                   'is_javascript': False})
                except urllib.error.HTTPError as error:
                    assert error.code == 404
                    self.save(name + '-missing-resource.json', {'status': error.code, 'is_javascript': False})
            finally:
                server.terminate()
                server.wait(timeout=15)
                record.update(exit_code=server.returncode, stopped_at=datetime.now(timezone.utc).isoformat())
                self.save(name + '-server.json', record)


def main():
    parser = argparse.ArgumentParser(description='FE-BASE 准确候选与真实浏览器基线验收')
    parser.add_argument('--criteria', required=True)
    parser.add_argument('--candidate', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--clean', action='store_true')
    args = parser.parse_args()
    root = Path.cwd().resolve()
    output = args.output.resolve()
    assert args.criteria == S and args.criteria != args.candidate, '使用准确冻结 S，S 严格先于 C'
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip() == args.candidate, 'HEAD 必须等于 C'
    assert subprocess.check_output(['git', 'status', '--porcelain']).decode().strip() == '', '候选工作树必须干净'
    assert output.is_relative_to(root / '.scratch-runtime'), '输出必须在专用忽略目录'
    assert not output.exists(), '保留原始证据，使用新输出目录'
    output.mkdir(parents=True)
    run = Run(root, output)
    git = run.git
    if args.clean:
        assert '.scratch-runtime' in root.parts and root.name.startswith('clean-'), '需要任务目录内独立干净检出'
        assert git('rev-parse', '--abbrev-ref', 'HEAD') == 'HEAD', '干净检出必须分离至准确 C'
        assert Path(git('rev-parse', '--path-format=absolute', '--git-common-dir')) == root / '.git'
    assert git('remote', 'get-url', 'origin') == ORIGIN
    git('merge-base', '--is-ancestor', args.criteria, args.candidate)
    assert git('merge-base', BASE, args.candidate) == BASE
    for name in ['criteria.md', 'upstream-manifest.json', 'browser-environment.json']:
        expected = subprocess.check_output(['git', 'show', args.criteria + ':evidence/FE-BASE/' + name])
        assert (root / 'evidence/FE-BASE' / name).read_bytes() == expected
    assert git('rev-parse', IMPORT + ':vendor/turbine-explorer') == TREE
    trailers = git('show', '-s', '--format=%B', IMPORT + '^2')
    assert 'git-subtree-dir: vendor/turbine-explorer' in trailers
    assert 'git-subtree-split: ' + UPSTREAM in trailers
    entries = json.loads((root / 'evidence/FE-BASE/upstream-manifest.json').read_text())
    vendor = root / 'vendor/turbine-explorer'
    assert not (vendor / '.git').exists()
    listing = git('ls-files', '--stage')
    assert not any(line.startswith('160000 ') for line in listing.splitlines())
    actual_files = {}
    changed_files = []
    for name, metadata in entries.items():
        original_bytes = subprocess.check_output(['git', 'show', IMPORT + ':vendor/turbine-explorer/' + name])
        assert sha(original_bytes) == metadata['sha256'] and len(original_bytes) == metadata['bytes'], name
        actual_bytes = (vendor / name).read_bytes()
        actual_files[name] = {'sha256': sha(actual_bytes), 'bytes': len(actual_bytes)}
        if actual_files[name] != metadata:
            assert name == 'src/component-inspector.ts', f'未登记的上游改动: {name}'
            changed_files.append(name)
    tracked_vendor = git('ls-tree', '-r', '--name-only', args.candidate, '--', 'vendor/turbine-explorer').splitlines()
    assert set(tracked_vendor) == {'vendor/turbine-explorer/' + name for name in entries}
    patch = git('diff', IMPORT, args.candidate, '--', 'vendor/turbine-explorer')
    (output / 'upstream.patch').write_text(patch)
    run.save('source.json', {'upstream': UPSTREAM, 'tree': TREE, 'import_commit': IMPORT, 'squash': True,
                            'files': entries, 'actual_files': actual_files, 'changed_files': changed_files,
                            'patch_empty': patch == ''})
    for revision in [args.criteria, IMPORT, args.candidate]:
        assert git('show', '-s', '--format=%an%n%ae%n%cn%n%ce', revision).splitlines() == [
            'lucy-assistant', '162398512+lucy-assistant@users.noreply.github.com'] * 2
    # 原资产、冻结、证据和历史工具按已集成基准逐字节回归。
    preserved = ['LICENSE', 'assets', 'evidence/M0-00', 'scripts/verify_m0_00.py',
                 'scripts/check_m0_00_failures.py', 'scripts/requirements-m0-00.txt', 'ACCEPTANCE.md']
    assert git('diff', '--name-only', BASE, args.candidate, '--', *preserved) == ''
    assert sha((root / 'ACCEPTANCE.md').read_bytes()) == '6593f43c6605311bec2375f0455b2e42940052a200ecc38f37da1bc93d382bb1'
    hashes_path = root / 'evidence/M0-00/runs/b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61/SHA256SUMS.json'
    for name, expected in json.loads(hashes_path.read_text()).items():
        assert sha((hashes_path.parent / name).read_bytes()) == expected
    git('diff', '--check', args.criteria, args.candidate, '--', '.', ':!vendor')
    run.save('regression.json', {'preserved_paths': preserved, 'm0_00_evidence_count': 39, 'state': 'PASS'})
    run.save('version.json', {'criteria_commit': args.criteria, 'tested_code_sha': args.candidate, 'base': BASE,
                             'node': run.run(['node', '--version']), 'npm': run.run(['npm', '--version']),
                             'clean_checkout_mode': args.clean, 'initial_working_tree_clean': True})
    if not args.clean:
        api = 'http://127.0.0.1:3082/orchestrator/api/'
        def get(name):
            request = urllib.request.Request(api + name, headers={'x-orchestrator-request': '1'})
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        canonical = lambda value: sha(json.dumps(value, sort_keys=True, ensure_ascii=False).encode())
        settings = get('settings')
        state = get('state')
        prompts = get('prompts')
        initial = json.loads((root / 'evidence/M0-00/initial-fingerprints.json').read_text())
        actual_blocks = {key: {'revision': value['revision'], 'value_sha256': canonical(value['value'])}
                         for key, value in settings['blocks'].items()}
        actual_sources = {value['id']: {'revision': value['revision'], 'value_sha256': canonical(value['value'])}
                          for value in settings['sources']}
        assert actual_blocks == initial['blocks'] and actual_sources == initial['sources']
        assert prompts['current']['revision'] == initial['prompts']['revision']
        assert canonical(prompts['current']['config']) == initial['prompts']['config_sha256']
        for item in initial['files']:
            assert sha(Path(item['path']).read_bytes()) == item['sha256']
        assert state['health']['runtime']['state'] == 'ready'
        assert state['load'] == {'running': 1, 'queued': 0, 'maxWorkers': 1}
        run.save('configuration-regression.json', {'blocks': actual_blocks, 'sources': actual_sources,
            'prompt_revision': prompts['current']['revision'], 'runtime': state['health']['runtime'],
            'load': state['load'], 'preserved_file_count': len(initial['files'])})
        assert run.run(['gh', 'api', 'user', '--jq', '.login']) == 'lucy-assistant'
        repo = json.loads(run.run(['gh', 'repo', 'view', 'shuyu-lin-dev/gas-turbine-lifecycle-lab',
                                  '--json', 'nameWithOwner,viewerPermission']))
        assert repo['nameWithOwner'] == 'shuyu-lin-dev/gas-turbine-lifecycle-lab' and repo['viewerPermission'] == 'WRITE'
        run.save('github.json', repo)
    run.run(['npm', 'ci', '--prefix', 'scripts/fe-base'], timeout=300)
    if not args.clean:
        original = output / 'original'
        original.mkdir()
        archive = output / 'original.tar'
        run.run(['git', 'archive', '--format=tar', '--output', str(archive), IMPORT + ':vendor/turbine-explorer'])
        with tarfile.open(archive) as source:
            source.extractall(original, filter='data')
        run.baseline(original, 'original')
    run.baseline(vendor, 'candidate')
    run.browser(vendor, 4174 if args.clean else 4173, 'candidate')
    assert git('status', '--porcelain') == ''
    run.save('results.json', {'criteria_commit': args.criteria, 'tested_code_sha': args.candidate,
             'required': {f'FE-BASE-A0{index}': 'PASS' for index in range(1, 6) if args.clean or index < 5},
             'clean_checkout_mode': args.clean, 'commands': len(run.commands)})
    run.save('SHA256SUMS.json', {str(path.relative_to(output)): sha(path.read_bytes())
                               for path in sorted(output.iterdir()) if path.is_file()})
    print(json.dumps({'state': 'PASS', 'candidate': args.candidate, 'output': str(output)}))


if __name__ == '__main__':
    main()
