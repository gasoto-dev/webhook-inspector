import Database from "better-sqlite3"
import path from "path"

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "webhooks.db")
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
    db.exec(`
      CREATE TABLE IF NOT EXISTS payloads (
        id TEXT PRIMARY KEY,
        endpoint_id TEXT NOT NULL,
        method TEXT NOT NULL,
        headers TEXT NOT NULL,
        body TEXT NOT NULL,
        source_ip TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_endpoint ON payloads (endpoint_id, created_at DESC);
    `)
  }
  return db
}

export interface Payload {
  id: string
  endpoint_id: string
  method: string
  headers: string
  body: string
  source_ip: string | null
  created_at: number
}

const TTL_MS = 24 * 60 * 60 * 1000

export function insertPayload(payload: Omit<Payload, "created_at">): Payload {
  const db = getDb()
  const created_at = Date.now()
  db.prepare(`
    INSERT INTO payloads (id, endpoint_id, method, headers, body, source_ip, created_at)
    VALUES (@id, @endpoint_id, @method, @headers, @body, @source_ip, @created_at)
  `).run({ ...payload, created_at })
  return { ...payload, created_at }
}

export function getPayloads(endpointId: string): Payload[] {
  const db = getDb()
  const cutoff = Date.now() - TTL_MS
  return db.prepare(
    "SELECT * FROM payloads WHERE endpoint_id = ? AND created_at > ? ORDER BY created_at DESC"
  ).all(endpointId, cutoff) as Payload[]
}

export function getPayload(id: string): Payload | undefined {
  const db = getDb()
  return db.prepare("SELECT * FROM payloads WHERE id = ?").get(id) as Payload | undefined
}

export function purgeExpired(): number {
  const db = getDb()
  const cutoff = Date.now() - TTL_MS
  const result = db.prepare("DELETE FROM payloads WHERE created_at < ?").run(cutoff)
  return result.changes
}
