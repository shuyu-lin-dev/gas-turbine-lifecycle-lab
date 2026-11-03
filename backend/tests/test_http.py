import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time

import httpx
import pytest


@pytest.fixture
def api():
    with socket.socket() as reservation:
        reservation.bind(('127.0.0.1', 0))
        port = reservation.getsockname()[1]
    env = dict(os.environ, API_INSTANCE_ID='api-a')
    process = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'gt_lifecycle_api.app:app',
                                '--host', '127.0.0.1', '--port', str(port)], env=env)
    url = f'http://127.0.0.1:{port}'
    try:
        deadline = time.monotonic() + 30
        while True:
            assert process.poll() is None, 'API启动失败'
            try:
                response = httpx.get(url + '/api/v1/health', timeout=1, trust_env=False)
                break
            except httpx.ConnectError:
                assert time.monotonic() < deadline, 'API启动超时'
                time.sleep(.1)
        assert response.status_code == 200
        yield url
    finally:
        if process.poll() is None:
            process.terminate()
        process.wait(timeout=10)


def test_health_returns_frozen_service_version_and_instance(api):
    expected = json.loads((Path(__file__).resolve().parents[2] / 'evidence/M0-01/health-api-a.json').read_text())
    response = httpx.get(api + '/api/v1/health', trust_env=False)
    assert response.status_code == 200
    assert response.headers['content-type'] == 'application/json'
    assert response.json() == expected


def test_cors_allows_declared_origin_and_rejects_other_origin(api):
    allowed = httpx.get(api + '/api/v1/health', headers={'Origin': 'http://127.0.0.1:5173'}, trust_env=False)
    assert allowed.headers['access-control-allow-origin'] == 'http://127.0.0.1:5173'
    denied = httpx.options(api + '/api/v1/health', headers={
        'Origin': 'http://untrusted.invalid', 'Access-Control-Request-Method': 'GET'}, trust_env=False)
    assert denied.status_code == 400
    assert 'access-control-allow-origin' not in denied.headers


@pytest.mark.parametrize('name,value', [
    ('API_INSTANCE_ID', 'bad instance'),
    ('API_CORS_ORIGINS', '["*"]'),
    ('API_CORS_ORIGINS', '["file:///invalid"]'),
    ('API_CORS_ORIGINS', '"http://127.0.0.1:5173"'),
])
def test_invalid_configuration_prevents_startup(name, value):
    result = subprocess.run([sys.executable, '-c', 'import gt_lifecycle_api.app'],
                            env=dict(os.environ, **{name: value}), capture_output=True, text=True, timeout=10)
    assert result.returncode != 0
    assert name in result.stderr


@pytest.mark.parametrize('path', ['/', '/index.html', '/api/v1/missing'])
def test_api_does_not_serve_frontend_or_unknown_routes(api, path):
    assert httpx.get(api + path, trust_env=False).status_code == 404


def test_health_rejects_post(api):
    assert httpx.post(api + '/api/v1/health', trust_env=False).status_code == 405
