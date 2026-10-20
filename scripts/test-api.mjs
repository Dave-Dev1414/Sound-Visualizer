import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

const port = 8799
const baseUrl = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, ['backend/server.mjs'], {
  env: { ...process.env, PORT: String(port), CORS_ORIGIN: 'http://localhost:5173' },
  stdio: 'ignore',
})
let serverClosed = false
server.once('exit', () => { serverClosed = true })

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (serverClosed) throw new Error('API server exited before becoming ready.')
    try {
      const response = await fetch(baseUrl + '/api/health')
      if (response.ok) return
    } catch { /* server is still starting */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('API server did not start in time.')
}

try {
  await waitForServer()
  const healthResponse = await fetch(baseUrl + '/api/health')
  const health = await healthResponse.json()
  assert.equal(health.status, 'ok')

  const session = {
    name: 'CI test session',
    master: 72,
    crossfade: 45,
    visualMode: 'waveform',
    eq: { A: { low: 2, mid: -1, high: 3 }, B: { low: 0, mid: 0, high: 0 } },
    deckGain: { A: -2, B: 1 },
  }
  const saveResponse = await fetch(baseUrl + '/api/session', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  })
  assert.equal(saveResponse.status, 200, 'valid session should save')

  const loadResponse = await fetch(baseUrl + '/api/session')
  const loaded = await loadResponse.json()
  assert.equal(loaded.session.name, session.name)
  assert.equal(loaded.session.eq.A.low, 2)
  assert.equal(loaded.session.visualMode, 'waveform')

  const invalidResponse = await fetch(baseUrl + '/api/session', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...session, master: 101 }),
  })
  assert.equal(invalidResponse.status, 400, 'invalid settings should be rejected')

  console.log('API smoke tests passed: health, save/load, validation.')
} finally {
  server.kill('SIGTERM')
}
