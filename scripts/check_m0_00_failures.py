import json
from pathlib import Path
import subprocess
from verify_m0_00 import API, Collector, ROOT


root = Path.cwd().resolve()
assert root == ROOT
candidate = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
output = root / '.scratch-runtime' / ('failure-probes-' + candidate)
assert not output.exists()
output.mkdir()
collector = Collector(output)
cases = [
    ('missing-executable', [str(root / '.scratch-runtime' / 'missing-command')], None, FileNotFoundError),
    ('http-error', ['curl', '--fail', '--silent', '--show-error', '--max-time', '30', '-H',
                    'x-orchestrator-request: 1', API + 'missing-m0-00-resource'], json.loads, RuntimeError),
    ('invalid-json', ['docker', 'compose', 'version'], json.loads, json.JSONDecodeError),
]
results = []
for name, argv, project, expected_error in cases:
    try:
        collector.run(argv, project=project)
    except expected_error:
        record = collector.commands[-1]
        assert record['argv'] == argv and record['state'] == 'failed'
        assert record['failure_type'] == expected_error.__name__
        if project:
            assert record['stdout'] in [None, '输出已脱敏，仅保留 SHA256']
            assert record['stdout_sha256']
        if name == 'missing-executable':
            assert record['exit_code'] is None
        if name == 'http-error':
            assert record['exit_code'] == 22
        if name == 'invalid-json':
            assert record['exit_code'] == 0
        results.append({'case': name, 'result': 'PASS', 'actual_failure_type': expected_error.__name__,
                        'actual_exit_code': record['exit_code']})
    else:
        raise AssertionError('预期的真实失败未出现: ' + name)
invalid_output = root / '.scratch-runtime' / ('invalid-criteria-' + candidate)
command = ['python3', 'scripts/verify_m0_00.py', '--criteria', candidate, '--candidate', candidate,
           '--output', str(invalid_output)]
completed = subprocess.run(command, cwd=root, capture_output=True, text=True, timeout=30)
collector.save('invalid-criteria.json', {'argv': command, 'exit_code': completed.returncode,
                                       'stdout': completed.stdout, 'stderr': completed.stderr})
assert completed.returncode == 1 and '使用已提交的 M0-00 冻结 S' in completed.stderr
results.append({'case': 'candidate-as-criteria', 'result': 'PASS', 'actual_exit_code': completed.returncode})
collector.save('results.json', {'tested_code_sha': candidate, 'cases': results,
                                'method': '实际进程、Docker CLI 与现有面板错误路径，无 Mock'})
print(json.dumps({'tested_code_sha': candidate, 'output': str(output), 'cases': results}, ensure_ascii=False))
