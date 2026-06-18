import express from 'express'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '../data')
mkdirSync(dataDir, { recursive: true })

const db = new Database(join(dataDir, 'programs.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    author TEXT NOT NULL,
    blocks TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

const app = express()
app.use(express.json({ limit: '1mb' }))

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')))
}

app.get('/api/programs', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, name, author, created_at,
           json_array_length(blocks) AS block_count
    FROM programs
    ORDER BY created_at DESC
  `).all()
  res.json(rows)
})

app.post('/api/programs', (req, res) => {
  const { name, author, blocks } = req.body
  if (!name?.trim() || !author?.trim() || !blocks) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }
  const result = db.prepare(
    'INSERT INTO programs (name, author, blocks) VALUES (?, ?, ?)'
  ).run(name.trim(), author.trim(), JSON.stringify(blocks))
  res.json({ id: result.lastInsertRowid })
})

app.get('/api/programs/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Programa no encontrado' })
  res.json({ ...row, blocks: JSON.parse(row.blocks) })
})

app.delete('/api/programs/:id', (req, res) => {
  db.prepare('DELETE FROM programs WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

app.use((_req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'), (err) => {
    if (err) res.status(500).send('Compilar primero con npm run build')
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`))
