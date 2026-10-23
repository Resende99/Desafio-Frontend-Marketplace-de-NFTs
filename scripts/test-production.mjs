import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
const result = spawnSync(process.execPath, [cli, 'test'], {
  env: { ...process.env, PLAYWRIGHT_PREVIEW: 'true' },
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
