// SQLite persistence using Node's built-in driver (Node >= 22.13, no native deps).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDb(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      email           TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      marketing_opt_in INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS journeys (
      id           TEXT PRIMARY KEY,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status       TEXT NOT NULL DEFAULT 'in_progress',
      step         INTEGER NOT NULL DEFAULT 0,
      answers      TEXT NOT NULL DEFAULT '{}',
      result       TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_journeys_user ON journeys(user_id);
  `);

  const q = {
    upsertUser: db.prepare(`
      INSERT INTO users (name, email, marketing_opt_in) VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        marketing_opt_in = MAX(users.marketing_opt_in, excluded.marketing_opt_in),
        updated_at = datetime('now')
      RETURNING id`),
    createJourney: db.prepare(`INSERT INTO journeys (id, user_id) VALUES (?, ?)`),
    getJourney: db.prepare(`
      SELECT j.*, u.name, u.email FROM journeys j JOIN users u ON u.id = j.user_id WHERE j.id = ?`),
    saveProgress: db.prepare(`
      UPDATE journeys SET answers = ?, step = ?, updated_at = datetime('now')
      WHERE id = ? AND status = 'in_progress'`),
    complete: db.prepare(`
      UPDATE journeys SET answers = ?, result = ?, status = 'complete',
        updated_at = datetime('now'), completed_at = COALESCE(completed_at, datetime('now'))
      WHERE id = ?`),
    list: db.prepare(`
      SELECT j.id, j.status, j.step, j.answers, j.result, j.created_at, j.completed_at,
             u.name, u.email, u.marketing_opt_in
      FROM journeys j JOIN users u ON u.id = j.user_id
      ORDER BY j.created_at DESC LIMIT ? OFFSET ?`),
    stats: db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM journeys) AS journeys,
        (SELECT COUNT(*) FROM journeys WHERE status = 'complete') AS completed`),
  };

  return {
    raw: db,
    startJourney(id, { name, email, optIn }) {
      const { id: userId } = q.upsertUser.get(name, email, optIn ? 1 : 0);
      q.createJourney.run(id, userId);
      return id;
    },
    getJourney(id) {
      const row = q.getJourney.get(id);
      if (!row) return null;
      return { ...row, answers: JSON.parse(row.answers), result: row.result ? JSON.parse(row.result) : null };
    },
    saveProgress(id, answers, step) {
      return q.saveProgress.run(JSON.stringify(answers), step, id).changes > 0;
    },
    complete(id, answers, result) {
      return q.complete.run(JSON.stringify(answers), JSON.stringify(result), id).changes > 0;
    },
    list(limit = 500, offset = 0) {
      return q.list.all(limit, offset).map((r) => ({
        ...r,
        answers: JSON.parse(r.answers),
        result: r.result ? JSON.parse(r.result) : null,
      }));
    },
    stats() {
      return { ...q.stats.get() };
    },
  };
}
