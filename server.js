import express from 'express';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openDb } from './db.js';
import { computeIkigai, sanitizeAnswers } from './public/js/engine.js';
import { QUESTIONS, THEMES } from './public/js/questions.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createApp({ dbFile = process.env.DB_FILE || join(__dirname, 'data', 'ikigai.db'), adminToken = process.env.ADMIN_TOKEN } = {}) {
  const db = openDb(dbFile);
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
        "frame-ancestors 'self'",
      ].join('; '),
    });
    next();
  });

  app.use(express.json({ limit: '64kb' }));

  // Tiny in-memory rate limiter for write endpoints.
  const hits = new Map();
  const limit = (max, windowMs) => (req, res, next) => {
    const key = `${req.ip}:${req.route?.path ?? req.path}`;
    const now = Date.now();
    const entry = hits.get(key) ?? { n: 0, reset: now + windowMs };
    if (now > entry.reset) Object.assign(entry, { n: 0, reset: now + windowMs });
    entry.n += 1;
    hits.set(key, entry);
    if (entry.n > max) return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    next();
  };
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  }, 60_000).unref();

  const getJourneyOr404 = (req, res) => {
    if (!UUID_RE.test(req.params.id)) {
      res.status(404).json({ error: 'Journey not found' });
      return null;
    }
    const j = db.getJourney(req.params.id);
    if (!j) res.status(404).json({ error: 'Journey not found' });
    return j;
  };

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.post('/api/journeys', limit(20, 15 * 60_000), (req, res) => {
    const name = String(req.body?.name ?? '').replace(/\s+/g, ' ').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    if (!name || name.length > 80) return res.status(400).json({ error: 'Please tell us your name (up to 80 characters).' });
    if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'That email address doesn’t look right.' });
    if (req.body?.consent !== true) return res.status(400).json({ error: 'Please agree to the privacy note to continue.' });
    const id = db.startJourney(randomUUID(), { name, email, optIn: req.body?.optIn === true });
    res.status(201).json({ id, name });
  });

  app.get('/api/journeys/:id', (req, res) => {
    const j = getJourneyOr404(req, res);
    if (!j) return;
    res.json({ id: j.id, name: j.name, status: j.status, step: j.step, answers: j.answers, result: j.result });
  });

  app.patch('/api/journeys/:id', limit(300, 15 * 60_000), (req, res) => {
    const j = getJourneyOr404(req, res);
    if (!j) return;
    if (j.status !== 'in_progress') return res.status(409).json({ error: 'This journey is already complete.' });
    const step = Math.max(0, Math.min(QUESTIONS.length + 10, Number(req.body?.step) || 0));
    db.saveProgress(j.id, sanitizeAnswers(req.body?.answers), step);
    res.json({ ok: true });
  });

  app.post('/api/journeys/:id/complete', limit(30, 15 * 60_000), (req, res) => {
    const j = getJourneyOr404(req, res);
    if (!j) return;
    const answers = sanitizeAnswers(req.body?.answers ?? j.answers);
    const result = computeIkigai(answers, j.name);
    db.complete(j.id, answers, result);
    res.json({ id: j.id, name: j.name, result });
  });

  // Public, shareable result (no email exposed).
  app.get('/api/results/:id', (req, res) => {
    const j = getJourneyOr404(req, res);
    if (!j) return;
    if (!j.result) return res.status(404).json({ error: 'This Ikigai hasn’t been revealed yet.' });
    res.json({ id: j.id, name: j.name, result: j.result, completedAt: j.completed_at });
  });

  // ───────────── Admin ─────────────
  const requireAdmin = (req, res, next) => {
    if (!adminToken) return res.status(503).json({ error: 'Admin is disabled. Set ADMIN_TOKEN to enable it.' });
    const given = Buffer.from(String(req.get('authorization') ?? '').replace(/^Bearer\s+/i, ''));
    const want = Buffer.from(adminToken);
    if (given.length !== want.length || !timingSafeEqual(given, want)) {
      return res.status(401).json({ error: 'Invalid admin token' });
    }
    next();
  };

  app.get('/api/admin/journeys', limit(120, 15 * 60_000), requireAdmin, (req, res) => {
    const lim = Math.min(1000, Math.max(1, Number(req.query.limit) || 500));
    const off = Math.max(0, Number(req.query.offset) || 0);
    res.json({ stats: db.stats(), journeys: db.list(lim, off) });
  });

  app.get('/api/admin/export.csv', limit(60, 15 * 60_000), requireAdmin, (req, res) => {
    const rows = db.list(100_000, 0);
    const label = (ids) => (ids ?? []).map((t) => THEMES[t]?.short ?? t).join(' + ');
    const header = ['name', 'email', 'marketing_opt_in', 'status', 'archetype', 'ikigai', 'passion', 'mission',
      'profession', 'vocation', 'love_words', 'good_words', 'needs_words', 'paid_words', 'work_style',
      'started_at', 'completed_at', 'result_link', 'answers_json'];
    const cell = (v) => {
      let s = v == null ? '' : String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // guard against spreadsheet formula injection
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const base = `${req.protocol}://${req.get('host')}`;
    const lines = [header.join(',')];
    for (const r of rows) {
      const x = r.result;
      lines.push([
        r.name, r.email, r.marketing_opt_in ? 'yes' : 'no', r.status, x?.archetype, label(x?.center),
        label(x?.overlaps?.passion), label(x?.overlaps?.mission), label(x?.overlaps?.profession), label(x?.overlaps?.vocation),
        x?.circles?.love?.words?.join('; '), x?.circles?.good?.words?.join('; '), x?.circles?.needs?.words?.join('; '),
        x?.circles?.paid?.words?.join('; '), x?.workStyle, r.created_at, r.completed_at,
        x ? `${base}/?r=${r.id}` : '', JSON.stringify(r.answers),
      ].map(cell).join(','));
    }
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="ikigai-submissions-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('\uFEFF' + lines.join('\r\n'));
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  app.use(express.static(join(__dirname, 'public'), { extensions: ['html'], maxAge: '1h' }));

  app.use((err, req, res, next) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return { app, db };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  const { app } = createApp();
  app.listen(port, () => {
    console.log(`✦ Ikigai is listening on http://localhost:${port}`);
    if (!process.env.ADMIN_TOKEN) console.log('  (admin dashboard disabled — set ADMIN_TOKEN to enable /admin)');
  });
}
