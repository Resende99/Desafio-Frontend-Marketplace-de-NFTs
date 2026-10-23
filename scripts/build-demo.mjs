import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const env = { ...process.env, VITE_ENABLE_MOCKS: 'true' }
const commands = [
  ['../node_modules/typescript/bin/tsc', ['-b']],
  ['../node_modules/vite/bin/vite.js', ['build']],
]

for (const [script, args] of commands) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url)), ...args], {
    env,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
