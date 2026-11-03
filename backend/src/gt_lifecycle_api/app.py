from importlib.metadata import version
import json
import os
import re
from typing import Literal
from urllib.parse import urlsplit

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class Health(BaseModel):
    schema_version: Literal['1']
    service: Literal['gt-lifecycle-api']
    version: str
    status: Literal['ok']
    instance_id: str


instance_id = os.environ.get('API_INSTANCE_ID', 'local')
if re.fullmatch(r'[A-Za-z0-9_-]{1,64}', instance_id) is None:
    raise ValueError('API_INSTANCE_ID需要1～64个ASCII字母、数字、下划线或连字符')

origins = json.loads(os.environ.get(
    'API_CORS_ORIGINS', '["http://127.0.0.1:5173", "http://127.0.0.1:4175"]'))
if not isinstance(origins, list) or not all(isinstance(origin, str) for origin in origins):
    raise ValueError('API_CORS_ORIGINS需要JSON字符串数组')
for origin in origins:
    parsed = urlsplit(origin)
    if (parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username
            or parsed.password or parsed.path or parsed.query or parsed.fragment
            or any(character.isspace() for character in origin)):
        raise ValueError('API_CORS_ORIGINS需要明确的HTTP/HTTPS origin')
    if parsed.port is not None and not 1 <= parsed.port <= 65535:
        raise ValueError('API_CORS_ORIGINS端口需要处于1～65535')

app = FastAPI(title='GT Lifecycle Lab API', version=version('gt-lifecycle-api'))
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=['GET'])


@app.get('/api/v1/health', response_model=Health)
def health() -> Health:
    return Health(schema_version='1', service='gt-lifecycle-api',
                  version=version('gt-lifecycle-api'), status='ok', instance_id=instance_id)
