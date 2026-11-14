// Runs the generated Google Apps Script in a sandbox with mocked Google services.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildGas, OUT } from '../scripts/build-gas.mjs';
import { SAMPLE_SYNTHESIS } from './fixtures.js';

test('google-apps-script/Code.gs is up to date (run `npm run build:gas`)', () => {
  assert.equal(readFileSync(OUT, 'utf8'), buildGas());
});

function sandbox({ apiKey = 'sk-test', claude } = {}) {
  const rows = [];
  const fetches = [];
  const cache = new Map();
  const range = (r) => ({
    getValues: () => [rows[r - 2] || []],
    setValues: ([v]) => { if (r === 1) return { setFontWeight() {} }; rows[r - 2] = v; return { setFontWeight() {} }; },
    setFontWeight() {},
    createTextFinder: (id) => ({ matchEntireCell: () => ({ findNext: () => { const i = rows.findIndex((x) => x[0] === id); return i >= 0 ? { getRow: () => i + 2 } : null; } }) }),
  });
  let headerWritten = false;
  const sheet = {
    getLastRow: () => (headerWritten ? rows.length + 1 : 0),
    getLastColumn: () => (headerWritten ? 27 : 0),
    getRange: (r) => (r === 1 ? { setValues: () => { headerWritten = true; return { setFontWeight() {} }; } } : range(r)),
    appendRow: (v) => rows.push(v),
    setFrozenRows() {},
  };
  const ctx = {
    console,
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => apiKey }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) ?? null, put: (k, v) => cache.set(k, v) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, insertSheet: () => sheet }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ setMimeType: () => ({ body: JSON.parse(t) }) }) },
    UrlFetchApp: {
      fetch: (url, opts) => {
        fetches.push({ url, opts, body: JSON.parse(opts.payload) });
        const out = claude(JSON.parse(opts.payload));
        return { getResponseCode: () => out.code ?? 200, getContentText: () => JSON.stringify(out.body ?? out) };
      },
    },
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(OUT, 'utf8'), ctx);
  const post = (payload) => ctx.doPost({ postData: { contents: JSON.stringify(payload) } }).body;
  return { ctx, post, rows, fetches };
}

const ID = '11111111-2222-4333-8444-555555555555';
const text = (obj) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(obj) }] });

test('Apps Script: saves rows, then upgrades them on completion', () => {
  const { post, rows } = sandbox({ claude: () => ({}) });
  assert.deepEqual(post({ type: 'start', id: ID, name: 'Aiko', email: 'AIKO@example.com', optIn: true }), { ok: true });
  assert.equal(rows.length, 1);
  assert.equal(rows[0][5], 'aiko@example.com');
  assert.equal(rows[0][3], 'in progress');
  post({ type: 'complete', id: ID, name: '=HYPERLINK("x")', email: 'aiko@example.com', engine: 'ai', ikigaiTitle: 'Stories that heal' });
  assert.equal(rows.length, 1, 'same row updated');
  assert.equal(rows[0][3], 'complete');
  assert.equal(rows[0][4], '\'=HYPERLINK("x")', 'formula injection neutralised');
  assert.equal(rows[0][22], 'ai');
  assert.equal(rows[0][23], 'Stories that heal');
  assert.equal(post({ type: 'start', id: 'nope', email: 'a@b.co' }).error, 'bad id');
});

test('Apps Script: cognitive engine calls Claude with the shared prompts', () => {
  const { post, fetches } = sandbox({
    claude: (body) => body.output_config.effort === 'low'
      ? text({ title: 'Which part of storytelling?', hint: 'Pick or write.', type: 'single', options: [
        { label: 'Poems', emoji: '📝', themes: ['words'] }, { label: 'Interviews', emoji: '🎙️', themes: ['words', 'connect'] },
      ] })
      : text(SAMPLE_SYNTHESIS),
  });
  const f = post({ type: 'followup', id: ID, name: 'Aiko', circle: 'love', answers: { love_flow: ['writing poems'] } });
  assert.equal(f.ok, true);
  assert.equal(f.question.source, 'ai');
  assert.equal(f.question.options.length, 2);
  const req = fetches[0];
  assert.equal(req.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(req.opts.headers['x-api-key'], 'sk-test');
  assert.equal(req.opts.headers['anthropic-version'], '2026-10-21');
  assert.equal(req.opts.headers['anthropic-beta'], 'server-side-fallback-2026-07-01');
  assert.equal(req.body.model, 'claude-opus-5-5');
  assert.match(req.body.messages[0].content, /"writing poems"/);

  const s = post({ type: 'synthesize', id: ID, name: 'Aiko', answers: { love_flow: ['writing poems'] } });
  assert.equal(s.ok, true);
  assert.equal(s.synthesis.ikigaiTitle, 'Stories that heal');
});

test('Apps Script: engine off without a key, errors and limits handled', () => {
  assert.equal(sandbox({ apiKey: '', claude: () => ({}) }).post({ type: 'followup', id: ID, circle: 'love' }).error, 'ai_disabled');
  const failing = sandbox({ claude: () => ({ code: 529, body: { error: 'overloaded' } }) });
  assert.equal(failing.post({ type: 'followup', id: ID, circle: 'love', answers: {} }).error, 'engine_error');
  const ok = sandbox({ claude: () => text({ title: 'Q?', hint: '', type: 'single', options: [{ label: 'A', emoji: '✦', themes: [] }, { label: 'B', emoji: '✦', themes: [] }] }) });
  for (let i = 0; i < 10; i++) assert.equal(ok.post({ type: 'followup', id: ID, circle: 'love', answers: {} }).ok, true);
  assert.equal(ok.post({ type: 'followup', id: ID, circle: 'love', answers: {} }).error, 'rate_limited');
  assert.equal(ok.ctx.doGet().body.ai, true);
});
