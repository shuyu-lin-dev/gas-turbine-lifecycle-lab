<script setup lang="ts">
import { onMounted, ref } from 'vue'
import './style.css'

interface Health {
  schema_version: '1'
  service: 'gt-lifecycle-api'
  version: string
  status: 'ok'
  instance_id: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const state = ref<'checking' | 'healthy' | 'failed'>('checking')
const health = ref<Health | null>(null)
const error = ref('')
const requestUrl = ref('')

function endpoint(): string {
  if (!apiBaseUrl || apiBaseUrl.trim() !== apiBaseUrl) {
    throw new Error('API地址配置为空或包含多余空白，请检查VITE_API_BASE_URL。')
  }
  const url = new URL(apiBaseUrl, window.location.origin)
  if ((!apiBaseUrl.startsWith('/') && !/^https?:\/\//.test(apiBaseUrl))
      || apiBaseUrl.startsWith('//') || !['http:', 'https:'].includes(url.protocol)
      || url.username || url.password || url.search || url.hash) {
    throw new Error('API地址需要同源路径或完整的HTTP/HTTPS地址。')
  }
  return url.href.replace(/\/$/, '') + '/health'
}

function validateHealth(value: unknown): Health {
  if (typeof value !== 'object' || value === null) throw new Error('健康接口返回的对象无效。')
  const data = value as Record<string, unknown>
  if (Object.keys(data).length !== 5 || data.schema_version !== '1'
      || data.service !== 'gt-lifecycle-api' || data.status !== 'ok'
      || typeof data.version !== 'string' || data.version.length === 0
      || typeof data.instance_id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(data.instance_id)) {
    throw new Error('健康接口返回的字段或版本无效。')
  }
  return data as unknown as Health
}

async function checkConnection() {
  state.value = 'checking'
  health.value = null
  error.value = ''
  try {
    requestUrl.value = endpoint()
    const response = await fetch(requestUrl.value, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!response.ok) throw new Error(`健康接口返回HTTP ${response.status}，请检查API服务。`)
    health.value = validateHealth(await response.json())
    state.value = 'healthy'
  } catch (cause) {
    state.value = 'failed'
    error.value = cause instanceof TypeError ? '无法访问API，请检查服务与地址后重新检查。'
      : cause instanceof Error && cause.name === 'TimeoutError' ? 'API在5秒内没有响应，请检查服务后重新检查。'
        : cause instanceof Error ? cause.message : '健康检查失败，请检查API服务。'
  }
}

onMounted(checkConnection)
</script>

<template>
  <div class="workspace">
    <header class="site-header">
      <a class="brand" href="/">GT Lifecycle Lab</a>
      <span class="teaching-label">教学实验平台</span>
    </header>
    <main>
      <section class="introduction" aria-labelledby="page-title">
        <p class="project-name">燃气轮机数字化样机与智能运维实验平台</p>
        <h1 id="page-title">服务连接</h1>
        <p class="description">查看平台与后端服务的连接情况，确认当前服务版本。</p>
        <p class="stage-note">当前阶段提供服务健康检查。</p>
      </section>
      <section class="connection-panel" aria-labelledby="connection-title">
        <div class="panel-heading">
          <h2 id="connection-title">后端服务</h2>
          <span class="connection-state" :class="state" role="status" aria-live="polite">
            <span aria-hidden="true" class="state-dot"></span>
            {{ state === 'healthy' ? '连接正常' : state === 'failed' ? '连接失败' : '正在检查' }}
          </span>
        </div>
        <dl class="service-details">
          <div><dt>请求地址</dt><dd data-testid="request-url">{{ requestUrl || apiBaseUrl }}</dd></div>
          <template v-if="health">
            <div><dt>服务名称</dt><dd>{{ health.service }}</dd></div>
            <div><dt>服务版本</dt><dd data-testid="version">{{ health.version }}</dd></div>
            <div><dt>服务状态</dt><dd data-testid="service-status">{{ health.status }}</dd></div>
            <div><dt>服务实例</dt><dd data-testid="instance">{{ health.instance_id }}</dd></div>
          </template>
        </dl>
        <p v-if="state === 'failed'" class="error-message" role="alert">{{ error }}</p>
        <button :disabled="state === 'checking'" type="button" @click="checkConnection">重新检查</button>
      </section>
    </main>
    <footer>通用燃气轮机教学与工程验证</footer>
  </div>
</template>
