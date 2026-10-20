import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const dataDirectory = resolve(root, 'data')
const sessionPath = resolve(dataDirectory, 'session.json')
const port = Number(process.env.PORT || 8787)
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
const maxBodyBytes = 64 * 1024

function send(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end(JSON.stringify(payload))
}

async function readSession() {
  try { return JSON.parse(await readFile(sessionPath, 'utf8')) }
  catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

async function readJson(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maxBodyBytes) throw Object.assign(new Error('Request body is too large.'), { statusCode: 413 })
    chunks.push(chunk)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw Object.assign(new Error('Request body must be valid JSON.'), { statusCode: 400 }) }
}

function validateSession(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Session must be an object.'
  if (typeof value.name !== 'string' || value.name.length > 100) return 'Session name must be a string of 100 characters or fewer.'
  for (const field of ['master', 'crossfade']) {
    if (typeof value[field] !== 'number' || !Number.isFinite(value[field]) || value[field] < 0 || value[field] > 100) return field + ' must be a number between 0 and 100.'
  }
  if (!['spectrum', 'waveform'].includes(value.visualMode)) return 'visualMode must be spectrum or waveform.'
  if (!value.eq || !value.deckGain) return 'EQ and deck gain settings are required.'
  for (const deck of ['A', 'B']) {
    for (const band of ['low', 'mid', 'high']) {
      const number = value.eq?.[deck]?.[band]
      if (typeof number !== 'number' || !Number.isFinite(number) || number < -12 || number > 12) return 'EQ values must be between -12 and 12 dB.'
    }
    const gain = value.deckGain?.[deck]
    if (typeof gain !== 'number' || !Number.isFinite(gain) || gain < -18 || gain > 6) return 'Deck gain values must be between -18 and 6 dB.'
  }
  return null
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost')
  if (request.method === 'OPTIONS') { send(response, 204, {}); return }
  if (url.pathname === '/api/health' && request.method === 'GET') {
    send(response, 200, { status: 'ok', service: 'sound-visualizer-api', persistence: 'json-file' })
    return
  }
  if (url.pathname === '/api/session' && request.method === 'GET') {
    try { send(response, 200, { session: await readSession() }) }
    catch { send(response, 500, { error: 'Could not read the saved session.' }) }
    return
  }
  if (url.pathname === '/api/session' && request.method === 'PUT') {
    try {
      const session = await readJson(request)
      const validationError = validateSession(session)
      if (validationError) { send(response, 400, { error: validationError }); return }
      await mkdir(dataDirectory, { recursive: true })
      await writeFile(sessionPath, JSON.stringify({ ...session, updatedAt: new Date().toISOString() }, null, 2) + '\n', 'utf8')
      send(response, 200, { saved: true, updatedAt: new Date().toISOString() })
    } catch (error) {
      send(response, error?.statusCode || 500, { error: error?.message || 'Could not save the session.' })
    }
    return
  }
  send(response, 404, { error: 'Route not found.' })
})

server.listen(port, '0.0.0.0', () => {
  console.log('Sound Visualizer API listening on http://localhost:' + port)
})

function shutdown() {
  server.close(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
