import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import yaml

REPOSITORY = 'shuyu-lin-dev/gas-turbine-lifecycle-lab'
ORIGIN = 'https://github.com/' + REPOSITORY + '.git'
BASE = 'dad14da1561ac609a5d14076629d1698c53b3627'
TICKET = '910aedd83224919debc9bc9021d86450'
SESSION = 'worker-' + TICKET
NAME = 'bootstrap-spec-freeze-910aedd83224'
BRANCH = 'agent/' + NAME
MAIN = Path('/home/lsy/workspace/lab/gas-turbine-lifecycle-lab')
ROOT = MAIN.parent / 'gas-turbine-lifecycle-lab-worktrees' / NAME
PREPARATION = Path('evidence/M0-00/preparation/20261103T142014+0800')
API = 'http://127.0.0.1:3082/orchestrator/api/'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return sha(json.dumps(value, sort_keys=True, ensure_ascii=False).encode())


class Collector:
    def __init__(self, output):
        self.output = output
        self.commands = []

    def save(self, name, value):
        path = self.output / name
        path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

    def run(self, argv, cwd=ROOT, project=None, encoding='utf-8'):
        record = {'argv': argv, 'cwd': str(cwd), 'at': datetime.now(timezone.utc).isoformat(),
                  'exit_code': None, 'state': 'started', 'stdout': None, 'stderr': None}
        self.commands.append(record)
        self.save('commands.json', self.commands)
        try:
            completed = subprocess.run(argv, cwd=cwd, capture_output=True, timeout=60)
            record.update(exit_code=completed.returncode, state='decoding',
                          stdout_sha256=sha(completed.stdout), stderr_sha256=sha(completed.stderr))
            stdout = completed.stdout.decode(encoding).replace('\x00', '')
            stderr = completed.stderr.decode(encoding).replace('\x00', '')
            if project:
                record['stdout'] = project(stdout) if completed.returncode == 0 else '输出已脱敏，仅保留 SHA256'
                record['stderr'] = '输出已脱敏，仅保留 SHA256' if stderr else ''
            else:
                record.update(stdout=stdout, stderr=stderr)
            record['state'] = 'completed'
            if completed.returncode != 0:
                raise RuntimeError(f'命令失败，退出码 {completed.returncode}: {argv}')
            return stdout
        except Exception as error:
            record.update(state='failed', failure_type=type(error).__name__)
            if isinstance(error, subprocess.TimeoutExpired):
                record.update(stdout_sha256=sha(error.stdout or b''), stderr_sha256=sha(error.stderr or b''),
                              timeout_seconds=error.timeout)
            raise
        finally:
            self.save('commands.json', self.commands)

    def get(self, path, project):
        text = self.run(['curl', '--fail', '--silent', '--show-error', '--max-time', '30',
                         '-H', 'x-orchestrator-request: 1', API + path],
                        project=lambda value: project(json.loads(value)))
        return json.loads(text)

    def git(self, *args, cwd=ROOT):
        return self.run(['git', *args], cwd=cwd).strip()


def configuration_summary(settings):
    source = next(s for s in settings['sources'] if s['id'] == 'github')
    blocks = settings['blocks']
    return {'github': {'value': source['value'], 'revision': source['revision']},
            'allowed': blocks['policy']['value']['sources']['github']['allowed'],
            'executor': blocks['executor'],
            'fingerprints': {k: {'revision': v['revision'], 'value_sha256': canonical(v['value'])}
                             for k, v in blocks.items()},
            'source_fingerprints': {s['id']: {'revision': s['revision'], 'value_sha256': canonical(s['value'])}
                                    for s in settings['sources']}}


def runtime_summary(state):
    return {'setup': {'machine': state['setup']['machine'], 'problem': state['setup']['problem'],
                      'accounts': {k: state['setup']['accounts'][k] for k in ['repository', 'agent']}},
            'health': {'runtime': state['health']['runtime']}, 'load': state['load'],
            'paused': state['paused'], 'masterId': state['masterId']}


def prompt_summary(prompts):
    current = prompts['current']
    return {'revision': current['revision'], 'savedAt': current['savedAt'],
            'config': current['config'], 'config_sha256': canonical(current['config']),
            'sessions': prompts['sessions'], 'notificationPending': prompts['notificationPending']}


def main():
    parser = argparse.ArgumentParser(description='M0-00 真实环境与准确候选核查')
    parser.add_argument('--criteria', required=True)
    parser.add_argument('--candidate', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert Path.cwd().resolve() == ROOT
    worker_environment = {key: os.environ.get(key) for key in ['DSH_SUPERAGENT_TICKET', 'DSH_SUPERAGENT_NAME', 'DSH_SUPERAGENT_DIR']}
    output = args.output.resolve()
    assert output.is_relative_to(ROOT / '.scratch-runtime'), '证据采集限于专用中间目录'
    assert not output.exists(), '保留已有运行证据，请使用新的运行目录'
    output.mkdir(parents=True)
    collector = Collector(output)
    git = collector.git
    assert git('rev-parse', 'HEAD') == args.candidate
    assert len(args.criteria) == len(args.candidate) == 40
    assert args.criteria == '3980867902a9c102f18894e9acf65b8c72051b19', '使用已提交的 M0-00 冻结 S'
    assert args.criteria != args.candidate, '冻结 S 必须先于候选 C'
    assert yaml.__version__ == '6.0.1'
    assert git('status', '--porcelain') == '', '准确候选必须包含全部改动'
    git('merge-base', '--is-ancestor', args.criteria, args.candidate)
    assert git('merge-base', BASE, args.candidate) == BASE
    assert git('show', args.criteria + ':ACCEPTANCE.md') == (ROOT / 'ACCEPTANCE.md').read_text().strip()
    assert sha((ROOT / 'ACCEPTANCE.md').read_bytes()) == '6593f43c6605311bec2375f0455b2e42940052a200ecc38f37da1bc93d382bb1'
    assert git('show', args.criteria + ':evidence/M0-00/criteria.md') == (ROOT / 'evidence/M0-00/criteria.md').read_text().strip()
    git('diff', '--check', BASE, args.candidate)
    git('diff', '--check')
    assert git('symbolic-ref', '--short', 'HEAD') == BRANCH
    assert git('remote', 'get-url', 'origin') == ORIGIN
    assert git('remote', 'get-url', 'origin', cwd=MAIN) == ORIGIN
    assert git('symbolic-ref', '--short', 'HEAD', cwd=MAIN) == 'main'
    assert git('rev-parse', '--show-toplevel') == str(ROOT)
    assert git('rev-parse', '--path-format=absolute', '--git-common-dir') == str(MAIN / '.git')
    collector.run(['pwd'])
    collector.run(['realpath', str(MAIN), str(ROOT)])
    worktrees = git('worktree', 'list', '--porcelain')
    assert 'worktree ' + str(MAIN) in worktrees and 'worktree ' + str(ROOT) in worktrees
    collector.run(['git', 'remote', '-v'], cwd=MAIN)
    collector.run(['git', 'remote', '-v'])
    identities = {}
    for revision in [args.criteria, args.candidate]:
        actual = git('show', '-s', '--format=%an%n%ae%n%cn%n%ce', revision).splitlines()
        assert actual == ['lucy-assistant', '162398512+lucy-assistant@users.noreply.github.com'] * 2
        identities[revision] = actual
    collector.save('git.json', {'base': BASE, 'criteria_commit': args.criteria, 'tested_code_sha': args.candidate,
                                'branch': BRANCH, 'identities': identities, 'worktrees': worktrees})

    settings = collector.get('settings', configuration_summary)
    config = configuration_summary(settings)
    collector.save('configuration.json', config)
    initial = json.loads((ROOT / 'evidence/M0-00/initial-fingerprints.json').read_text())
    assert config['fingerprints'] == initial['blocks']
    assert config['source_fingerprints'] == initial['sources']
    assert config['github']['value']['enabled'] is True
    assert config['github']['value']['config']['repository'] == REPOSITORY
    assert {'id': 'shuyu-lin-dev'} in config['allowed']
    assert config['executor']['value']['maxWorkers'] == 1
    assert config['executor']['value']['directory'] == str(ROOT.parent)
    assert 'gh-owner' in config['executor']['value']['blockedCommands']
    preserved = []
    for item in initial['files']:
        data = Path(item['path']).read_bytes()
        assert sha(data) == item['sha256'] and len(data) == item['bytes'], item['path']
        preserved.append(item)
    collector.save('preservation.json', {'unchanged_files': preserved, 'unchanged_settings': True})

    version = collector.run(['dsh', '--version']).strip()
    state = collector.get('state', runtime_summary)
    assert state['health']['runtime']['state'] == 'ready' and state['paused'] is False
    assert state['setup']['accounts']['repository'] == REPOSITORY
    assert state['setup']['accounts']['agent'] == 'lucy-assistant'
    assert state['setup']['machine']['stateDir'] == '/home/lsy/.dsh/state/gas-turbine-lifecycle-lab'
    assert state['load'] == {'running': 1, 'queued': 0, 'maxWorkers': 1}
    ticket = collector.get('tickets/' + TICKET, lambda v: {k: v[k] for k in ['id', 'title', 'sessionId', 'directory', 'mandate', 'assignments']})
    assert ticket['id'] == TICKET and ticket['sessionId'] == SESSION and ticket['directory'] == str(ROOT)
    assert ticket['mandate']['actor']['id'] == 'shuyu-lin-dev'
    tickets = collector.get('tickets', lambda v: {'items': [{k: t[k] for k in ['id', 'sessionId', 'directory', 'state', 'stage']} for t in v['items']], 'total': v['total'], 'next_offset': v['next_offset']})
    assert tickets['total'] == 1 and tickets['next_offset'] is None and tickets['items'][0]['id'] == TICKET
    prompts = collector.get('prompts', prompt_summary)
    summary = prompt_summary(prompts)
    assert summary['revision'] == initial['prompts']['revision']
    assert summary['config_sha256'] == initial['prompts']['config_sha256']
    sessions = {s['sessionId']: s['revision'] for s in prompts['sessions']}
    assert sessions[state['masterId']] == sessions[SESSION] == summary['revision']
    collector.save('prompts.json', summary)
    collector.save('runtime.json', {'dsh_version': version, 'state': runtime_summary(state),
                                    'ticket': {k: ticket[k] for k in ['id', 'sessionId', 'directory', 'mandate']},
                                    'sessions': sessions, 'tool_process_environment': worker_environment})
    profile = Path('/home/lsy/.dsh/profiles/superagent')
    base_config = yaml.safe_load((profile / 'cordis.yml').read_text())
    patch = yaml.safe_load((profile / 'cordis.patch.yml').read_text())
    assert isinstance(base_config, list) and isinstance(patch, list)
    agent_config = next(item['config'] for item in patch if item.get('id') == 'dsh-superagent')
    assert agent_config['stateDir'] == state['setup']['machine']['stateDir']
    processes = collector.run(['ps', '-eo', 'pid,args'], project=lambda v: [line for line in v.splitlines() if '--profile superagent' in line and 'dsh' in line and 'python' not in line and 'bash' not in line])
    selected = [line for line in processes.splitlines() if '--profile superagent' in line and 'dsh' in line and 'python' not in line and 'bash' not in line]
    assert selected
    collector.save('profile.json', {'profile': 'superagent', 'path': str(profile), 'stateDir': agent_config['stateDir'],
                                    'plugin_ids': [item['id'] for item in patch if 'id' in item], 'processes': selected})

    user = json.loads(collector.run(['gh', 'api', 'user'], project=lambda v: {'login': json.loads(v)['login'], 'id': json.loads(v)['id']}))
    assert user['login'] == 'lucy-assistant'
    repo = json.loads(collector.run(['gh', 'repo', 'view', REPOSITORY, '--json', 'nameWithOwner,viewerPermission,defaultBranchRef']))
    metadata = json.loads(collector.run(['gh', 'api', 'repos/' + REPOSITORY], project=lambda v: {k: json.loads(v)[k] for k in ['full_name', 'permissions', 'default_branch', 'visibility']}))
    assert repo['nameWithOwner'] == metadata['full_name'] == REPOSITORY
    assert repo['viewerPermission'] in ['WRITE', 'MAINTAIN', 'ADMIN']
    assert metadata['permissions']['push'] is True and metadata['permissions']['pull'] is True
    collector.save('github.json', {'login': user['login'], 'repository': repo, 'metadata': {k: metadata[k] for k in ['full_name', 'permissions', 'default_branch', 'visibility']}})

    collector.run(['uname', '-a'])
    collector.run(['docker', 'context', 'show'])
    context = json.loads(collector.run(['docker', 'context', 'inspect']))
    docker = json.loads(collector.run(['docker', 'version', '--format', '{{json .}}']))
    info_keys = ['ServerVersion', 'OperatingSystem', 'OSType', 'Name', 'KernelVersion', 'NCPU', 'MemTotal', 'Labels']
    info = json.loads(collector.run(['docker', 'info', '--format', '{{json .}}'], project=lambda v: {k: json.loads(v)[k] for k in info_keys}))
    compose = collector.run(['docker', 'compose', 'version']).strip()
    wsl_version = collector.run(['wsl.exe', '--version'], encoding='utf-16-le')
    wsl_list = collector.run(['wsl.exe', '--list', '--verbose'], encoding='utf-16-le')
    assert docker['Client']['Os'] == docker['Server']['Os'] == info['OSType'] == 'linux'
    assert docker['Server']['Platform']['Name'].startswith('Docker Desktop')
    assert info['OperatingSystem'] == 'Docker Desktop' and info['Name'] == 'docker-desktop'
    assert 'docker-desktop' in wsl_list and '2' in wsl_list
    assert 'WSL2' in info['KernelVersion']
    assert compose.startswith('Docker Compose version ')
    collector.save('docker.json', {'version': docker, 'info': {k: info[k] for k in info_keys}, 'compose': compose,
                                   'context': context, 'environment': {k: os.environ.get(k) for k in ['DOCKER_HOST', 'DOCKER_CONTEXT']},
                                   'wsl_version': wsl_version, 'wsl_list': wsl_list})

    mapping = json.loads((ROOT / PREPARATION / 'migration-map.json').read_text())
    assets = [item for item in mapping['mappings'] if item['destination'].startswith('assets/')]
    assert len(assets) == 16
    for item in assets:
        data = (ROOT / item['destination']).read_bytes()
        assert sha(data) == item['source_sha256'] and len(data) == item['source_bytes'], item['destination']
    license_original = collector.run(['git', 'show', BASE + ':LICENSE']).encode()
    assert (ROOT / 'LICENSE').read_bytes() == license_original
    tracked = git('ls-files').splitlines()
    assert not any(name.startswith(('frontend/', 'backend/', 'assistant/', 'vendor/', 'tests/')) for name in tracked)
    assert not any('/.git/' in name or name.endswith('/.git') for name in tracked)
    assert not any(Path(name).name in ['.env', 'hosts.yml', 'cordis.patch.yml'] for name in tracked)
    collector.save('regression.json', {'assets_verified': [{'path': item['destination'], 'sha256': item['source_sha256']} for item in assets],
                                       'original_license_sha256': sha(license_original), 'scope_files': tracked,
                                       'acceptance_sha256': sha((ROOT / 'ACCEPTANCE.md').read_bytes())})
    remote = json.loads(collector.run(['gh', 'api', 'repos/' + REPOSITORY + '/git/ref/heads/' + BRANCH]))
    assert remote['object']['sha'] == args.candidate
    prs = json.loads(collector.run(['gh', 'pr', 'list', '--repo', REPOSITORY, '--head', BRANCH, '--state', 'open',
                                    '--json', 'number,url,author,headRefName,headRefOid,baseRefName']))
    assert len(prs) == 1 and prs[0]['headRefOid'] == args.candidate and prs[0]['headRefName'] == BRANCH
    assert prs[0]['author']['login'] == 'lucy-assistant' and prs[0]['baseRefName'] == 'main'
    collector.save('remote.json', {'branch': BRANCH, 'remote_sha': remote['object']['sha'], 'pr': prs[0]})
    collector.save('version-check.json', {'criteria_commit': args.criteria, 'tested_code_sha': args.candidate,
                                         'merge_base': BASE, 'criteria_is_ancestor': True, 'working_tree_clean': True,
                                         'prompt_revision': summary['revision'], 'sessions': sessions})
    files = {p.name: sha(p.read_bytes()) for p in output.iterdir() if p.is_file()}
    collector.save('evidence-hashes.json', files)
    print(json.dumps({'candidate': args.candidate, 'output': str(output), 'collected_files': len(files),
                      'automatic_checks': 'PASS', 'manual_scope_delivery_review': 'REQUIRED', 'independent_review': 'PENDING'}))


if __name__ == '__main__':
    main()
