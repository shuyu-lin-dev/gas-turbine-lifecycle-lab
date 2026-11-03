import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import time
import urllib.error
import urllib.request

root = Path.cwd().resolve()
output = root / '.scratch-runtime/coordinator-m001-rereview'
python = output / 'main-01/wheel-env/bin/python'
records = []
http = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def save():
    (output / 'origin-probe.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')


def configuration(name, value, accepted):
    env = dict(os.environ, **{name: value})
    argv = [str(python), '-c', 'import gt_lifecycle_api.app; print(gt_lifecycle_api.app.origins)']
    result = subprocess.run(argv, env=env, capture_output=True, text=True, timeout=10)
    records.append({'argv': argv, 'configuration': {name: value}, 'accepted': accepted,
                    'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr})
    save()
    assert (result.returncode == 0) == accepted, records[-1]


valid = ['http://127.0.0.1:5173', 'http://localhost:4175', 'https://example.com',
         'https://sub.example.com:443', 'http://[::1]:5173', 'http://example.com:1',
         'http://example.com:65535']
invalid = ['*', 'http://*', 'https://*.example.com', 'http://example.*',
           'http://%2A', 'https://%2A.example.com', 'file:///invalid', 'ftp://example.com',
           'http://', 'example.com', '', 'http://user:password@example.com',
           'http://example.com/path', 'http://example.com/', 'http://example.com?value=1',
           'http://example.com#fragment', 'http://example.com:0', 'http://example.com:65536',
           'http://example.com:invalid', 'http://exam ple.com', 'http://example.com\n']
for origin in valid:
    configuration('API_CORS_ORIGINS', json.dumps([origin]), True)
configuration('API_CORS_ORIGINS', '[]', True)
for origin in invalid:
    configuration('API_CORS_ORIGINS', json.dumps([origin]), False)
for value in ['null', '{}', '123', '[1]', '"http://127.0.0.1:5173"', 'invalid-json']:
    configuration('API_CORS_ORIGINS', value, False)
for value in ['', 'bad instance', 'a' * 65, '中文']:
    configuration('API_INSTANCE_ID', value, False)
for value in ['a', 'api-a_1', 'a' * 64]:
    configuration('API_INSTANCE_ID', value, True)

with socket.socket() as reservation:
    reservation.bind(('127.0.0.1', 0))
    port = reservation.getsockname()[1]
argv = [str(python), '-m', 'uvicorn', 'gt_lifecycle_api.app:app', '--host', '127.0.0.1', '--port', str(port)]
allowed = 'http://127.0.0.1:5173'
log = (output / 'origin-api.log').open('w')
process = subprocess.Popen(argv, env=dict(os.environ, API_INSTANCE_ID='api-a', API_CORS_ORIGINS=json.dumps([allowed])), stdout=log, stderr=subprocess.STDOUT)
entry = {'argv': argv, 'pid': process.pid, 'port': port, 'responses': []}
records.append(entry)
save()


def request(method, origin=None):
    headers = {} if origin is None else {'Origin': origin}
    if method == 'OPTIONS':
        headers['Access-Control-Request-Method'] = 'GET'
    req = urllib.request.Request(f'http://127.0.0.1:{port}/api/v1/health', headers=headers, method=method)
    try:
        response = http.open(req, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        item = {'method': method, 'origin': origin, 'status': response.status,
                'headers': dict(response.headers), 'body': response.read().decode()}
    entry['responses'].append(item)
    save()
    return item


try:
    deadline = time.monotonic() + 30
    while True:
        assert process.poll() is None
        try:
            result = request('GET')
            break
        except urllib.error.URLError:
            assert time.monotonic() < deadline
            time.sleep(.1)
    assert result['status'] == 200
    expected = json.loads((root / 'evidence/M0-01/health-api-a.json').read_text())
    assert json.loads(result['body']) == expected
    for origin in [allowed, 'http://untrusted.invalid']:
        for method in ['GET', 'OPTIONS']:
            result = request(method, origin)
            headers = {key.lower(): value for key, value in result['headers'].items()}
            if origin == allowed:
                assert result['status'] == 200
                assert headers['access-control-allow-origin'] == origin
                if method == 'OPTIONS':
                    assert headers['access-control-allow-methods'] == 'GET'
            else:
                assert result['status'] == (400 if method == 'OPTIONS' else 200)
                assert 'access-control-allow-origin' not in headers
    entry['state'] = 'PASS'
finally:
    process.terminate()
    process.wait(timeout=15)
    entry['exit_code'] = process.returncode
    log.close()
    save()
print(json.dumps({'state': 'PASS', 'configuration_cases': len(records) - 1, 'http_cases': len(entry['responses'])}))
