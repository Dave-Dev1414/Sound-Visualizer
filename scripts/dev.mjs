import { spawn } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const children = [
  spawn(npmCommand, ['run', 'server'], { stdio: 'inherit', shell: process.platform === 'win32' }),
  spawn(npmCommand, ['run', 'dev'], { stdio: 'inherit', shell: process.platform === 'win32' }),
]

let shuttingDown = false
function stopAll(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM')
  }
  process.exitCode = code
}
for (const child of children) {
  child.on('error', error => {
    console.error('Could not start a development process:', error.message)
    stopAll(1)
  })
  child.on('exit', (code, signal) => {
    if (!shuttingDown && (code !== 0 || signal)) stopAll(code || 1)
  })
}
process.on('SIGINT', () => stopAll(0))
process.on('SIGTERM', () => stopAll(0))
