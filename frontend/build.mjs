import { spawnSync } from 'node:child_process'
import { cp } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
for (const [cwd, args] of [['frontend', ['run', 'build:shell']], ['vendor/turbine-explorer', ['run', 'build']]]) {
  const result = spawnSync('npm', args, { cwd: new URL(cwd + '/', new URL('../', import.meta.url)), stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
await cp(root + 'vendor/turbine-explorer/dist', root + 'frontend/dist/viewer', { recursive: true })
