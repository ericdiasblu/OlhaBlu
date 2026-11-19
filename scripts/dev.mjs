import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const python = resolve(root, 'backend', '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
const vite = resolve(root, 'frontend/node_modules/vite/bin/vite.js')
const webOnly = process.argv.includes('--web')
const apiOnly = process.argv.includes('--api')
const commands = []

if (!webOnly) {
  if (!existsSync(python)) {
    console.error('Crie backend/.venv e instale backend/requirements.txt conforme o README.md.')
    process.exit(1)
  }
  commands.push([python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload', '--no-access-log', '--no-proxy-headers'], 'backend'])
}
if (!apiOnly) {
  if (!existsSync(vite)) {
    console.error('Execute npm --prefix frontend ci antes de iniciar.')
    process.exit(1)
  }
  commands.push([process.execPath, [vite, '--host', '127.0.0.1'], 'frontend'])
}

const children = []
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  process.exitCode = code
  for (const child of children) child.kill('SIGTERM')
}
for (const [command, args, folder] of commands) {
  const child = spawn(command, args, { cwd: resolve(root, folder), stdio: 'inherit', windowsHide: true })
  children.push(child)
  child.on('error', error => { console.error(error.message); stop(1) })
  child.on('exit', code => { if (!stopping) stop(code ?? 1) })
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
console.log('\nAEX local: http://127.0.0.1:5173 | API: http://127.0.0.1:8000/api/docs\n')
