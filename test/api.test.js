import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { computeIkigai, sanitizeAnswers } from '../public/js/engine.js';

let server;
let base;

before(async () => {
  const { app } = createApp({ dbFile: ':memory:', adminToken: 'secret-token' });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const post = (path, body, method = 'POST') =>
  fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const ANSWERS = {
  love_saturday: ['tinker', 'learn', 'venture'],
  love_flow: ['coding side projects', 'reading about startups'],
  love_topics: ['tech', 'biz'],
  love_child: 'apart',
  good_askedfor: ['fixtech', 'numbers'],
  good_praise: ['debugging', 'Excel'],
  good_strengths: { logic: 5, leading: 4 },
  good_wall: 'prototype',
  needs_problems: ['jobs', 'digital'],
  needs_who: ['founders'],
  needs_fix: ['small businesses drowning in admin'],
  needs_impact: 'wide',
  paid_market: ['software', 'consult'],
  paid_before: ['building websites'],
  paid_style: 'business',
};

test('engine finds a coherent ikigai', () => {
  const r = computeIkigai(ANSWERS, 'Kenji Tanaka');
  assert.equal(r.name, 'Kenji');
  assert.ok(r.center.includes('tech'), `expected tech at the centre, got ${r.center}`);
  assert.equal(r.center.length, 2);
  for (const k of ['passion', 'mission', 'profession', 'vocation']) assert.ok(r.overlaps[k].length >= 1);
  assert.deepEqual(r.circles.love.words, ['coding side projects', 'reading about startups']);
  assert.ok(r.harmony > 0 && r.harmony <= 100);
  assert.ok(r.paths.length >= 3);
});

test('engine copes with empty answers', () => {
  const r = computeIkigai({}, '');
  assert.equal(r.center.length, 2);
  assert.ok(r.archetype.startsWith('The '));
});

test('sanitizeAnswers drops unknown and oversized input', () => {
  const s = sanitizeAnswers({
    love_saturday: ['tinker', 'nope', 'tinker', 'read', 'host', 'music'],
    love_child: 'not-an-option',
    love_flow: ['x'.repeat(500), 42, '  ok  '],
    bogus: 'field',
    good_strengths: { logic: 99, empathy: 'a' },
  });
  assert.deepEqual(s.love_saturday, ['tinker', 'read', 'host']);
  assert.equal(s.love_child, undefined);
  assert.equal(s.love_flow[0].length, 60);
  assert.equal(s.love_flow[1], 'ok');
  assert.equal(s.bogus, undefined);
  assert.deepEqual(s.good_strengths, { logic: 5 });
});

test('full journey: start → autosave → complete → public result', async () => {
  let res = await post('/api/journeys', { name: 'Kenji', email: 'Kenji@Example.com', consent: true, optIn: true });
  assert.equal(res.status, 201);
  const { id } = await res.json();
  assert.match(id, /^[0-9a-f-]{36}$/);

  res = await post(`/api/journeys/${id}`, { answers: { love_saturday: ['tinker'] }, step: 2 }, 'PATCH');
  assert.equal(res.status, 200);

  res = await fetch(`${base}/api/journeys/${id}`);
  const saved = await res.json();
  assert.deepEqual(saved.answers, { love_saturday: ['tinker'] });
  assert.equal(saved.step, 2);

  res = await fetch(`${base}/api/results/${id}`);
  assert.equal(res.status, 404, 'no result before completion');

  res = await post(`/api/journeys/${id}/complete`, { answers: ANSWERS });
  assert.equal(res.status, 200);
  const done = await res.json();
  assert.ok(done.result.archetype);

  res = await fetch(`${base}/api/results/${id}`);
  const pub = await res.json();
  assert.equal(pub.name, 'Kenji');
  assert.equal(pub.email, undefined, 'public result must not leak email');
  assert.deepEqual(pub.result, done.result);

  res = await post(`/api/journeys/${id}`, { answers: {}, step: 0 }, 'PATCH');
  assert.equal(res.status, 409, 'completed journeys are locked');
});

test('validation errors', async () => {
  assert.equal((await post('/api/journeys', { name: '', email: 'a@b.co', consent: true })).status, 400);
  assert.equal((await post('/api/journeys', { name: 'A', email: 'nope', consent: true })).status, 400);
  assert.equal((await post('/api/journeys', { name: 'A', email: 'a@b.co' })).status, 400);
  assert.equal((await fetch(`${base}/api/results/not-a-uuid`)).status, 404);
  assert.equal((await fetch(`${base}/api/results/00000000-0000-0000-0000-000000000000`)).status, 404);
});

test('same email is one user across journeys', async () => {
  await post('/api/journeys', { name: 'Ana', email: 'ana@example.com', consent: true });
  await post('/api/journeys', { name: 'Ana M', email: 'ANA@example.com', consent: true });
  const res = await fetch(`${base}/api/admin/journeys`, { headers: { Authorization: 'Bearer secret-token' } });
  const { journeys } = await res.json();
  const ana = journeys.filter((j) => j.email.toLowerCase() === 'ana@example.com');
  assert.equal(ana.length, 2);
  assert.ok(ana.every((j) => j.name === 'Ana M'));
});

test('admin endpoints require the token', async () => {
  assert.equal((await fetch(`${base}/api/admin/journeys`)).status, 401);
  assert.equal((await fetch(`${base}/api/admin/journeys`, { headers: { Authorization: 'Bearer wrong' } })).status, 401);
  const res = await fetch(`${base}/api/admin/export.csv`, { headers: { Authorization: 'Bearer secret-token' } });
  assert.equal(res.status, 200);
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], 'UTF-8 BOM so Excel reads names correctly');
  const csv = new TextDecoder().decode(bytes);
  assert.match(csv, /^name,email,marketing_opt_in/);
  assert.match(csv, /kenji@example\.com/);
});

test('serves the app and security headers', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
  assert.match(await res.text(), /Find Your Ikigai/);
  assert.equal((await fetch(`${base}/admin`)).status, 200);
});
