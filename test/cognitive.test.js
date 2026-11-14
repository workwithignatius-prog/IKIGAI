import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { createAi } from '../ai.js';
import { computeIkigai, localFollowup, mergeSynthesis, sanitizeAnswers, validateQuestionDef } from '../public/js/engine.js';
import { buildFollowupRequest, buildSynthesisRequest, buildTranscript, parseAiMessage, AI_MODEL } from '../public/js/cognitive.js';
import { CIRCLE_ORDER, THEME_IDS } from '../public/js/questions.js';
import { SAMPLE_SYNTHESIS } from './fixtures.js';


const ANSWERS = {
  love_enjoy: ['read', 'helping'],
  love_flow: ['deep conversations', 'writing poems'],
  good_at: ['listen', 'writing'],
  good_praise: ['listening'],
  needs_causes: ['health'],
  needs_who: ['patients'],
  paid_skills: ['content', 'wellness'],
  paid_style: 'creator',
  notes: { love_enjoy: 'Honestly a long walk and a long talk with a friend about life', needs_causes: 'mental health stigma', bogus_q: 'x' },
};

const msg = (obj, stop = 'end_turn') => ({ stop_reason: stop, content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(obj) }] });

test('every circle gets a valid rule-based adaptive question that reflects earlier answers', () => {
  for (const c of CIRCLE_ORDER) {
    const def = localFollowup(c, ANSWERS);
    assert.ok(def, c);
    assert.equal(def.circle, c);
    assert.equal(def.source, 'local');
    assert.ok(def.options.length >= 5, `${c} has options`);
    assert.ok(def.options.every((o) => o.themes.every((t) => THEME_IDS.includes(t))));
  }
  const love = localFollowup('love', ANSWERS);
  assert.ok(love.options.some((o) => o.themes.includes('care') || o.themes.includes('words')), 'love follow-up builds on care/words');
});

test('open-ended notes and adaptive answers are sanitised and scored', () => {
  const def = localFollowup('love', ANSWERS);
  const raw = { ...ANSWERS, adapt_love: { def, value: [def.options[0].id, 'not-an-option'] } };
  const s = sanitizeAnswers(raw);
  assert.equal(s.notes.bogus_q, undefined, 'notes only for real questions');
  assert.match(s.notes.love_enjoy, /long walk/);
  assert.deepEqual(s.adapt_love.value, [def.options[0].id]);
  assert.equal(sanitizeAnswers({ adapt_love: { def: { title: 'x', options: [] } } }).adapt_love, undefined, 'invalid defs dropped');

  // A note alone can carry a whole circle.
  const onlyNotes = computeIkigai({ notes: { paid_skills: 'people pay me for coding websites and apps' } });
  assert.equal(onlyNotes.circles.paid.top[0].id, 'tech');
});

test('generated question definitions are validated defensively', () => {
  const def = validateQuestionDef({
    title: 'x'.repeat(500),
    type: 'weird',
    options: [{ label: 'A', themes: ['care', 'nope', 'words', 'tech'] }, { label: 'a' }, { label: 'B', emoji: '<b>' }, null],
  }, 'love');
  assert.equal(def.title.length, 200);
  assert.equal(def.type, 'chips');
  assert.deepEqual(def.options.map((o) => o.label), ['A', 'B'], 'duplicates and junk removed');
  assert.deepEqual(def.options[0].themes, ['care', 'words']);
});

test('prompts carry the transcript, own words and a strict JSON schema', () => {
  const t = buildTranscript(sanitizeAnswers(ANSWERS), 'Aiko');
  assert.match(t, /"deep conversations"/);
  assert.match(t, /Added in their own words: "Honestly a long walk/);

  const f = buildFollowupRequest('needs', ANSWERS, 'Aiko');
  assert.equal(f.model, AI_MODEL);
  assert.equal(f.output_config.format.type, 'json_schema');
  assert.equal(f.output_config.effort, 'low');
  assert.equal(f.fallbacks, 'default');
  assert.match(f.messages[0].content, /What the world NEEDS/);
  assert.doesNotMatch(f.messages[0].content, /What you can be PAID FOR/, 'only circles answered so far');

  const s = buildSynthesisRequest(ANSWERS, 'Aiko');
  assert.equal(s.output_config.effort, 'medium');
  assert.match(s.messages[0].content, /<analysis>/);
  assert.ok(s.output_config.format.schema.required.includes('ikigai_title'));
  assert.throws(() => buildFollowupRequest('nope', ANSWERS));
});

test('AI responses: refusals and truncation are rejected, synthesis merges and re-validates', () => {
  assert.throws(() => parseAiMessage(msg({}, 'refusal')), /refused/);
  assert.throws(() => parseAiMessage(msg({}, 'max_tokens')), /truncated/);

  const merged = mergeSynthesis(computeIkigai(ANSWERS, 'Aiko'), parseAiMessage(msg(SAMPLE_SYNTHESIS)), ANSWERS);
  assert.equal(merged.archetype, 'The Storytelling Healer');
  assert.equal(merged.ai.ikigaiTitle, 'Stories that heal');
  assert.deepEqual(merged.center, ['care', 'words']);
  assert.equal(merged.ai.nextSteps.length, 3);
  assert.equal(merged.careers.length, 5);
  assert.equal(merged.careers[0].title, 'Mental-health content writer');
  assert.equal(merged.careers[0].does, 'Write articles and guides for clinics.');
  assert.equal(typeof merged.careers[0].circles.love, 'boolean', 'circle fit checked against the answers');
  assert.equal(merged.plan[0].when, 'This week');
  assert.equal(mergeSynthesis(computeIkigai(ANSWERS), { ...SAMPLE_SYNTHESIS, careers: [] }).ai, null, 'needs careers');

  // Round-trip through a share link (camelCase) is re-validated, not trusted.
  const again = mergeSynthesis(computeIkigai(ANSWERS, 'Aiko'), { ...merged.ai, archetype: 'y'.repeat(500) });
  assert.equal(again.ai.archetype.length, 60);
  assert.equal(mergeSynthesis(computeIkigai(ANSWERS), { ikigaiTitle: 'x' }).ai, null, 'incomplete synthesis ignored');
  assert.equal(mergeSynthesis(computeIkigai(ANSWERS), null).ai, null);
});

test('ai.js turns Claude responses into questions and survives failures', async () => {
  const calls = [];
  const fake = {
    beta: {
      messages: {
        create: async (body) => {
          calls.push(body);
          if (body.output_config.effort === 'low') {
            return msg({ title: 'You said "deep conversations". Who with?', hint: 'Pick or write.', type: 'chips', options: [
              { label: 'Strangers on trains', emoji: '🚆', themes: ['connect'] },
              { label: 'People in crisis', emoji: '🫂', themes: ['care'] },
            ] });
          }
          throw new Error('boom');
        },
      },
    },
  };
  const ai = createAi({ client: fake });
  const q = await ai.followup('love', ANSWERS, 'Aiko');
  assert.equal(q.source, 'ai');
  assert.equal(q.max, 2);
  assert.deepEqual(calls[0].betas, ['server-side-fallback-2026-07-01']);
  assert.equal(await ai.synthesize(ANSWERS, 'Aiko'), null, 'errors become null so the rules engine takes over');
  assert.equal(createAi({ apiKey: '' }).enabled, false);
});

// ───────────── Server endpoints with a stub engine ─────────────
let server;
let base;
before(async () => {
  const stubAi = {
    enabled: true,
    followup: async (circle) => validateQuestionDef({ title: `AI question for ${circle}`, type: 'single', source: 'ai', options: [
      { label: 'One', themes: ['care'] }, { label: 'Two', themes: ['words'] },
    ] }, circle),
    synthesize: async () => SAMPLE_SYNTHESIS,
  };
  ({ app: server } = createApp({ dbFile: ':memory:', adminToken: 't', ai: stubAi }));
  server = server.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('server: adaptive follow-up, AI synthesis on completion, AI fields in CSV', async () => {
  assert.deepEqual(await (await fetch(`${base}/api/health`)).json(), { ok: true, ai: true });
  const { id } = await (await post('/api/journeys', { name: 'Aiko', email: 'aiko@example.com', consent: true })).json();

  const f = await (await post(`/api/journeys/${id}/followup`, { circle: 'good', answers: ANSWERS })).json();
  assert.equal(f.question.title, 'AI question for good');
  assert.equal((await post(`/api/journeys/${id}/followup`, { circle: 'x', answers: ANSWERS })).status, 400);

  const done = await (await post(`/api/journeys/${id}/complete`, { answers: ANSWERS })).json();
  assert.equal(done.result.ai.ikigaiTitle, 'Stories that heal');
  const pub = await (await fetch(`${base}/api/results/${id}`)).json();
  assert.equal(pub.result.archetype, 'The Storytelling Healer');

  const csv = await (await fetch(`${base}/api/admin/export.csv`, { headers: { Authorization: 'Bearer t' } })).text();
  assert.match(csv, /,ai,Stories that heal,/);
});

test('server: without an AI key the rule-based engine answers', async () => {
  const { app } = createApp({ dbFile: ':memory:', ai: createAi({ apiKey: '' }) });
  const s = app.listen(0);
  await new Promise((r) => s.once('listening', r));
  const b = `http://127.0.0.1:${s.address().port}`;
  try {
    const { id } = await (await fetch(`${b}/api/journeys`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'B', email: 'b@example.com', consent: true }) })).json();
    const f = await (await fetch(`${b}/api/journeys/${id}/followup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ circle: 'love', answers: ANSWERS }) })).json();
    assert.equal(f.question.source, 'local');
    const done = await (await fetch(`${b}/api/journeys/${id}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: ANSWERS }) })).json();
    assert.equal(done.result.ai, null);
  } finally {
    s.close();
  }
});
