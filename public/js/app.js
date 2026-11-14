import { CIRCLES, CIRCLE_ORDER, OVERLAPS, QUESTIONS, THEMES } from './questions.js';
import { computeIkigai, localFollowup, mergeSynthesis, validateQuestionDef } from './engine.js';
import { buildDiagramSVG, svgToPngBlob, esc } from './diagram.js';
import { CONFIG } from './config.js';

const STORE_KEY = 'ikigai.journey.v2';
const PROFILE_KEY = 'ikigai.profile.v1';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const stage = document.getElementById('stage');
const progressEl = document.getElementById('progress');

// Flow: an intro card for each circle, followed by its questions.
const FLOW = CIRCLE_ORDER.flatMap((c) => [
  { kind: 'intro', circle: c },
  ...QUESTIONS.filter((q) => q.circle === c).map((q) => ({ kind: 'q', q, circle: c })),
]);
const TOTAL_Q = QUESTIONS.length;

const state = {
  id: null,
  name: '',
  email: '',
  step: 0,
  answers: {},
};

// ───────────── storage helpers ─────────────
const store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* private mode */ }
  },
  del(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

function persistLocal() {
  store.set(STORE_KEY, { id: state.id, name: state.name, email: state.email, step: state.step, answers: state.answers, status: 'in_progress' });
}

// ───────────── Backend detection & static (GitHub Pages) mode ─────────────
let STATIC = false;
const BASE = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;

async function detectStatic() {
  if (CONFIG.mode === 'static') return true;
  if (CONFIG.mode === 'server') return false;
  if (location.hostname.endsWith('.github.io')) return true;
  try {
    const res = await fetch('api/health', { cache: 'no-store' });
    return !(res.ok && (await res.json()).ok === true);
  } catch {
    return true;
  }
}

/** Send a submission to the Google Sheet (static mode). Fire-and-forget. */
function toSheet(payload) {
  if (!CONFIG.sheetUrl) return;
  fetch(CONFIG.sheetUrl, {
    method: 'POST',
    mode: 'no-cors',
    keepalive: true,
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, page: BASE, at: new Date().toISOString() }),
  }).catch(() => {});
}

// Share links in static mode carry the first name + answers (never the email).
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

async function encodeShare(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if ('CompressionStream' in window) return `z${b64url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
  return `j${b64url(bytes)}`;
}
async function decodeShare(code) {
  let bytes = unb64url(code.slice(1));
  if (code[0] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  return JSON.parse(new TextDecoder().decode(bytes));
}

// ───────────── API ─────────────
async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.timeout ? AbortSignal.timeout(opts.timeout) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

/** Call the cognitive engine on the Google Apps Script backend (static / GitHub Pages mode). */
async function engineCall(payload, timeout) {
  if (!CONFIG.sheetUrl || CONFIG.ai === false) throw new Error('engine not configured');
  const res = await fetch(CONFIG.sheetUrl, {
    method: 'POST', // no custom headers, so the browser sends a simple request Apps Script can answer
    body: JSON.stringify({ ...payload, id: state.id, name: state.name, answers: state.answers }),
    signal: AbortSignal.timeout(timeout),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'engine error');
  return data;
}

let saveTimer;
function autosave() {
  persistLocal();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!state.id || STATIC) return;
    api(`/api/journeys/${state.id}`, { method: 'PATCH', body: { answers: state.answers, step: state.step } }).catch(() => {});
  }, 500);
}

// ───────────── UI helpers ─────────────
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function setPhase(phase, circle = '') {
  document.body.dataset.phase = phase;
  document.body.dataset.circle = circle;
}

let swapping = Promise.resolve();
function render(html, after) {
  swapping = swapping.then(async () => {
    if (!reduceMotion && stage.firstElementChild) {
      stage.classList.add('leaving');
      await new Promise((r) => setTimeout(r, 220));
    }
    stage.innerHTML = html;
    stage.classList.remove('leaving');
    stage.classList.add('entering');
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('entering')));
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    after?.();
    const focusTarget = stage.querySelector('[data-autofocus]') || stage.querySelector('h1, h2');
    if (focusTarget) {
      if (!focusTarget.hasAttribute('tabindex') && !/INPUT|BUTTON|TEXTAREA/.test(focusTarget.tagName)) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
    }
  });
  return swapping;
}

function updateProgress() {
  const item = FLOW[state.step];
  const show = item && (item.kind === 'q' || item.kind === 'intro');
  progressEl.hidden = !show;
  if (!show) return;
  const qIndex = FLOW.slice(0, state.step + 1).filter((f) => f.kind === 'q').length;
  const answered = qIndex - (item.kind === 'q' ? 1 : 0);
  document.getElementById('progress-circle').textContent = CIRCLES[item.circle].title;
  document.getElementById('progress-count').textContent = item.kind === 'q' ? `${qIndex} / ${TOTAL_Q}` : `Circle ${CIRCLE_ORDER.indexOf(item.circle) + 1} of 4`;
  document.getElementById('progress-fill').style.width = `${(answered / TOTAL_Q) * 100}%`;
  for (const el of progressEl.querySelectorAll('.mini-venn circle')) {
    const c = el.dataset.c;
    const qs = QUESTIONS.filter((q) => q.circle === c);
    const done = qs.filter((q) => FLOW.findIndex((f) => f.q === q) < state.step).length;
    el.style.setProperty('--fill', String(done / qs.length));
    el.classList.toggle('current', c === item.circle);
  }
}

const venn = (cls = '') => `
  <svg class="venn ${cls}" viewBox="0 0 400 400" aria-hidden="true">
    <defs>
      ${CIRCLE_ORDER.map((c) => `<radialGradient id="g-${c}-${cls}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${CIRCLES[c].glow}" stop-opacity=".95"/><stop offset=".75" stop-color="${CIRCLES[c].glow}" stop-opacity=".55"/><stop offset="1" stop-color="${CIRCLES[c].glow}" stop-opacity=".1"/></radialGradient>`).join('')}
    </defs>
    <g class="venn-spin">
      <circle class="v v-love" cx="200" cy="135" r="112" fill="url(#g-love-${cls})"/>
      <circle class="v v-good" cx="135" cy="200" r="112" fill="url(#g-good-${cls})"/>
      <circle class="v v-needs" cx="265" cy="200" r="112" fill="url(#g-needs-${cls})"/>
      <circle class="v v-paid" cx="200" cy="265" r="112" fill="url(#g-paid-${cls})"/>
    </g>
    <circle class="v-core" cx="200" cy="200" r="${cls === 'hero' ? 62 : 34}"/>
  </svg>`;

// ───────────── Screens ─────────────
function landing() {
  setPhase('landing');
  progressEl.hidden = true;
  const saved = store.get(STORE_KEY);
  const resume = saved?.id && saved.status === 'in_progress';
  const done = saved?.id && saved.status === 'complete';
  render(`
    <section class="landing">
      <div class="hero-visual">
        ${venn('hero')}
        <span class="hero-kanji" lang="ja">生き甲斐</span>
        <span class="hero-tag tag-love">love</span>
        <span class="hero-tag tag-good">gifts</span>
        <span class="hero-tag tag-needs">the world</span>
        <span class="hero-tag tag-paid">value</span>
      </div>
      <div class="hero-copy">
        <p class="eyebrow">Ikigai &middot; <span lang="ja">生き甲斐</span> &middot; a reason for being</p>
        <h1>Somewhere between what you love and what the world needs,<br><em>there&rsquo;s you.</em></h1>
        <p class="lede">The Japanese call it <strong>ikigai</strong>: the quiet place where four circles meet. In about seven minutes, sixteen questions will trace your circles, and each circle ends with a question written just for you. Then you’ll get the map of where they overlap.</p>
        <div class="cta-row">
          ${resume ? `
            <button class="btn btn-primary" data-act="resume" data-autofocus>Continue your journey, ${esc(saved.name?.split(' ')[0] || 'friend')} &rarr;</button>
            <button class="btn btn-ghost" data-act="start">Start fresh</button>` : done ? `
            <button class="btn btn-primary" data-act="view" data-autofocus>See your Ikigai again &rarr;</button>
            <button class="btn btn-ghost" data-act="start">Take it again</button>` : `
            <button class="btn btn-primary" data-act="start" data-autofocus>Begin the journey &rarr;</button>`}
        </div>
        <ul class="facts">
          <li><span>16</span> questions</li>
          <li><span>4</span> circles</li>
          <li><span>~7</span> minutes</li>
          <li><span>1</span> personal map</li>
        </ul>
      </div>
    </section>`, () => {
    stage.querySelector('[data-act="start"]')?.addEventListener('click', profile);
    stage.querySelector('[data-act="resume"]')?.addEventListener('click', () => {
      Object.assign(state, { id: saved.id, name: saved.name, email: saved.email || '', step: Math.min(saved.step || 0, FLOW.length - 1), answers: saved.answers || {} });
      showStep();
    });
    stage.querySelector('[data-act="view"]')?.addEventListener('click', () => (saved.share ? loadShared(saved.share) : loadResult(saved.id, true)));
  });
}

function profile() {
  setPhase('profile');
  progressEl.hidden = true;
  const p = store.get(PROFILE_KEY) || {};
  render(`
    <section class="panel profile">
      <p class="eyebrow">Before we begin</p>
      <h2>Who&rsquo;s taking this journey?</h2>
      <p class="hint">We&rsquo;ll use your name to personalise your map, and your email so you can find your Ikigai again.</p>
      <form id="profile-form" novalidate>
        <label class="field">
          <span>Your first name</span>
          <input name="name" autocomplete="given-name" maxlength="80" required value="${esc(p.name || '')}" placeholder="e.g. Aiko" data-autofocus>
        </label>
        <label class="field">
          <span>Your email</span>
          <input name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" required value="${esc(p.email || '')}" placeholder="you@example.com">
        </label>
        <label class="check">
          <input type="checkbox" name="consent" required>
          <span>I agree that my name, email and answers are saved, and that my first name and answers are analysed by an AI service (Anthropic’s Claude) to generate my Ikigai. My email is never shared with it.</span>
        </label>
        <label class="check">
          <input type="checkbox" name="optIn">
          <span>Send me occasional ideas for living my Ikigai. <em>(optional)</em></span>
        </label>
        <p class="form-error" id="form-error" role="alert"></p>
        <div class="nav">
          <button type="button" class="btn btn-ghost" data-act="back">&larr; Back</button>
          <button type="submit" class="btn btn-primary">Let&rsquo;s go &rarr;</button>
        </div>
      </form>
    </section>`, () => {
    const form = document.getElementById('profile-form');
    const err = document.getElementById('form-error');
    stage.querySelector('[data-act="back"]').addEventListener('click', landing);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      err.textContent = '';
      if (!name) return (err.textContent = 'What should we call you?'), form.name.focus();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return (err.textContent = 'That email doesn’t look quite right.'), form.email.focus();
      if (!fd.get('consent')) return (err.textContent = 'Please tick the privacy box so we can save your answers.'), form.consent.focus();
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Opening the circles…';
      try {
        const optIn = !!fd.get('optIn');
        let id;
        if (STATIC) {
          id = crypto.randomUUID();
          toSheet({ type: 'start', id, name, email, optIn, consent: true });
        } else {
          ({ id } = await api('/api/journeys', { method: 'POST', body: { name, email, consent: true, optIn } }));
        }
        store.set(PROFILE_KEY, { name, email, optIn });
        Object.assign(state, { id, name, email, step: 0, answers: {} });
        followups.clear();
        persistLocal();
        showStep();
      } catch (ex) {
        err.textContent = ex.message || 'We couldn’t reach the server. Please try again.';
        btn.disabled = false;
        btn.textContent = 'Let’s go →';
      }
    });
  });
}

function showStep() {
  const item = FLOW[state.step];
  if (!item) return weave();
  setPhase(item.kind === 'intro' ? 'intro' : 'question', item.circle);
  updateProgress();
  if (item.kind === 'intro') return intro(item.circle);
  if (item.q.type === 'adaptive') return adaptive(item.q);
  return question(item.q);
}

function go(delta) {
  state.step = Math.max(0, Math.min(FLOW.length, state.step + delta));
  autosave();
  if (state.step >= FLOW.length) return weave();
  showStep();
}

function intro(circle) {
  const c = CIRCLES[circle];
  const n = CIRCLE_ORDER.indexOf(circle) + 1;
  render(`
    <section class="intro intro-${circle}">
      <div class="intro-orb"><span lang="ja">${c.kanji}</span></div>
      <p class="eyebrow">Circle ${n} of 4 &middot; <span lang="ja">${c.jp}</span></p>
      <h2>${esc(c.pre)} <strong>${esc(c.key)}</strong></h2>
      <p class="lede">${c.intro}</p>
      <div class="nav center">
        ${state.step > 0 ? '<button class="btn btn-ghost" data-act="back">&larr; Back</button>' : ''}
        <button class="btn btn-primary" data-act="next" data-autofocus>${n === 1 ? 'Step inside' : 'Enter this circle'} &rarr;</button>
      </div>
    </section>`, () => {
    stage.querySelector('[data-act="next"]').addEventListener('click', () => go(1));
    stage.querySelector('[data-act="back"]')?.addEventListener('click', () => go(-1));
  });
}

// ───────────── Answers ─────────────
// Adaptive questions keep their generated definition next to the answer: { def, value }.
const getVal = (q) => (q.adaptive ? state.answers[q.id]?.value : state.answers[q.id]);
function setVal(q, v) {
  if (q.adaptive) state.answers[q.id] = { ...state.answers[q.id], value: v };
  else state.answers[q.id] = v;
}
const getNote = (q) => state.answers.notes?.[q.id] || '';
function setNote(q, text) {
  const notes = { ...(state.answers.notes || {}) };
  if (text.trim()) notes[q.id] = text.slice(0, 400);
  else delete notes[q.id];
  state.answers.notes = notes;
}

function isAnswered(q) {
  const a = getVal(q);
  const note = getNote(q).trim();
  if (q.type === 'chips') return (Array.isArray(a) && a.length > 0) || !!note;
  if (q.type === 'single') return !!a || !!note;
  return true; // tags are optional, scales always have a value
}

function ownWordsSoFar() {
  const words = [];
  for (const q of QUESTIONS) {
    if (q.type === 'tags') words.push(...(state.answers[q.id] || []));
    const n = state.answers.notes?.[q.id];
    if (n) words.push(n.length > 70 ? `${n.slice(0, 68).trimEnd()}…` : n);
  }
  return words;
}

// ───────────── Adaptive questions ─────────────
const followups = new Map(); // circle → Promise<def>

function requestFollowup(circle) {
  if (!followups.has(circle)) {
    const pending = (async () => {
      try {
        let data;
        if (STATIC) data = await engineCall({ type: 'followup', circle }, 45_000);
        else data = await api(`/api/journeys/${state.id}/followup`, { method: 'POST', body: { circle, answers: state.answers }, timeout: 50_000 });
        return validateQuestionDef(data.question, circle);
      } catch {
        return null;
      }
    })().then((def) => def || localFollowup(circle, state.answers));
    followups.set(circle, pending);
  }
  return followups.get(circle);
}

async function adaptive(q) {
  const existing = state.answers[q.id]?.def;
  if (existing) return question(q, existing);

  const quotes = ownWordsSoFar().slice(-3);
  await render(`
    <section class="thinking" aria-live="polite">
      <div class="think-orb" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="eyebrow">The Ikigai engine is reflecting</p>
      <h2>Reading between your lines&hellip;</h2>
      ${quotes.length ? `<ul class="think-quotes">${quotes.map((w, i) => `<li style="--i:${i}">&ldquo;${esc(w)}&rdquo;</li>`).join('')}</ul>` : ''}
      <p class="muted">Writing your next question from what you&rsquo;ve shared so far.</p>
      <div class="nav center"><button class="btn btn-ghost" data-act="back">&larr; Back</button></div>
    </section>`, () => stage.querySelector('[data-act="back"]').addEventListener('click', () => go(-1)));

  const minWait = new Promise((r) => setTimeout(r, reduceMotion ? 0 : 1600));
  const [def] = await Promise.all([requestFollowup(q.circle), minWait]);
  if (FLOW[state.step]?.q !== q) return; // they navigated away meanwhile
  state.answers[q.id] = { def, value: def.type === 'single' ? null : [] };
  autosave();
  question(q, def);
}

// ───────────── Question screen ─────────────
function questionNumber(q) {
  return QUESTIONS.indexOf(q) + 1;
}

function question(base, def) {
  const q = def ? { ...def, id: base.id, circle: base.circle, adaptive: true } : base;
  if (q.type === 'scale' && !state.answers[q.id]) {
    state.answers[q.id] = Object.fromEntries(q.items.map((i) => [i.id, 3]));
  }
  const num = String(questionNumber(base)).padStart(2, '0');
  const badge = q.adaptive
    ? `<p class="adaptive-badge"><span aria-hidden="true">✦</span> ${q.source === 'ai' ? 'Written just for you by the Ikigai engine' : 'Shaped by your answers so far'}</p>`
    : '';
  render(`
    <section class="panel question q-${q.type}${q.adaptive ? ' is-adaptive' : ''}">
      <p class="q-meta"><span class="q-num">${num}</span><span class="q-total">/ ${TOTAL_Q}</span></p>
      ${badge}
      <h2 id="q-title">${esc(q.title)}</h2>
      ${q.hint ? `<p class="hint">${esc(q.hint)}</p>` : ''}
      <div class="q-body">${body(q)}</div>
      ${q.type === 'tags' ? '' : noteField(q)}
      <div class="nav">
        <button class="btn btn-ghost" data-act="back">&larr; Back</button>
        <span class="enter-hint" aria-hidden="true">press <kbd>Enter &crarr;</kbd></span>
        <button class="btn btn-primary" data-act="next">Continue &rarr;</button>
      </div>
    </section>`, () => wire(q));
}

function noteField(q) {
  const note = getNote(q);
  return `
    <div class="note${note ? ' has-text' : ''}">
      <label for="note-field" class="note-label"><span aria-hidden="true">✎</span> In your own words <em>(optional, but it helps us find your Ikigai)</em></label>
      <textarea id="note-field" rows="2" maxlength="400" placeholder="${esc(q.note || 'Anything to add? Say it your way…')}">${esc(note)}</textarea>
    </div>`;
}

function body(q) {
  const a = getVal(q);
  if (q.type === 'chips') {
    const sel = new Set(a || []);
    return `
      <div class="chips" role="group" aria-labelledby="q-title">
        ${q.options.map((o, i) => `
          <button type="button" class="chip" data-id="${esc(o.id)}" aria-pressed="${sel.has(o.id)}" style="--i:${i}" ${i === 0 ? 'data-autofocus' : ''}>
            <span class="chip-emoji" aria-hidden="true">${esc(o.emoji)}</span><span>${esc(o.label)}</span>
          </button>`).join('')}
      </div>
      <p class="counter" aria-live="polite"><span id="count">${sel.size}</span> of ${q.max} chosen</p>`;
  }
  if (q.type === 'single') {
    return `
      <div class="cards" role="radiogroup" aria-labelledby="q-title">
        ${q.options.map((o, i) => `
          <button type="button" class="card-opt" role="radio" data-id="${esc(o.id)}" aria-checked="${a === o.id}" style="--i:${i}" ${(a ? a === o.id : i === 0) ? 'data-autofocus' : ''}>
            <span class="card-emoji" aria-hidden="true">${esc(o.emoji)}</span><span>${esc(o.label)}</span>
          </button>`).join('')}
      </div>`;
  }
  if (q.type === 'tags') {
    return `
      <div class="tags-input">
        <ul class="tag-list" id="tag-list" aria-label="Your answers"></ul>
        <div class="tag-entry">
          <input id="tag-field" maxlength="60" placeholder="${esc(q.placeholder)}" aria-labelledby="q-title" autocomplete="off" data-autofocus>
          <button type="button" class="btn btn-small" id="tag-add">Add</button>
        </div>
        <p class="tag-max" id="tag-max"></p>
        <div class="suggestions"><span class="sugg-label">Need a spark?</span>
          ${q.suggestions.map((s) => `<button type="button" class="sugg" data-s="${esc(s)}">+ ${esc(s)}</button>`).join('')}
        </div>
      </div>`;
  }
  if (q.type === 'scale') {
    return `
      <div class="scales">
        ${q.items.map((it, i) => `
          <label class="scale" style="--i:${i}">
            <span class="scale-label"><span aria-hidden="true">${it.emoji}</span> ${esc(it.label)}</span>
            <input type="range" min="1" max="5" step="1" value="${a[it.id] ?? 3}" data-id="${it.id}" ${i === 0 ? 'data-autofocus' : ''}>
            <output class="scale-val">${SCALE_WORDS[a[it.id] ?? 3]}</output>
          </label>`).join('')}
      </div>`;
  }
  return '';
}

const SCALE_WORDS = { 1: 'I struggle', 2: 'Takes effort', 3: 'Fairly natural', 4: 'Strong', 5: 'Effortless' };

function wire(q) {
  const next = stage.querySelector('[data-act="next"]');
  const back = stage.querySelector('[data-act="back"]');
  back.addEventListener('click', () => go(-1));
  wire.commit = null;

  const refresh = () => {
    next.disabled = !isAnswered(q);
    if (q.type === 'tags') next.innerHTML = (state.answers[q.id]?.length ? 'Continue' : 'Skip for now') + ' &rarr;';
  };

  next.addEventListener('click', () => {
    wire.commit?.();
    if (isAnswered(q)) go(1);
  });

  const note = stage.querySelector('#note-field');
  if (note) {
    const grow = () => {
      note.style.height = 'auto';
      note.style.height = `${Math.min(note.scrollHeight, 220)}px`;
    };
    note.addEventListener('input', () => {
      setNote(q, note.value);
      note.parentElement.classList.toggle('has-text', !!note.value.trim());
      grow();
      refresh();
      autosave();
    });
    grow();
  }

  if (q.type === 'chips') {
    const counter = stage.querySelector('.counter');
    const update = () => {
      const sel = getVal(q) || [];
      stage.querySelector('#count').textContent = sel.length;
      stage.querySelectorAll('.chip').forEach((b) => {
        const on = sel.includes(b.dataset.id);
        b.setAttribute('aria-pressed', on);
        b.classList.toggle('dim', !on && sel.length >= q.max);
      });
      refresh();
    };
    stage.querySelectorAll('.chip').forEach((b) =>
      b.addEventListener('click', () => {
        const sel = [...(getVal(q) || [])];
        const i = sel.indexOf(b.dataset.id);
        if (i >= 0) sel.splice(i, 1);
        else if (sel.length < q.max) sel.push(b.dataset.id);
        else {
          counter.classList.remove('shake');
          void counter.offsetWidth;
          counter.classList.add('shake');
          return;
        }
        setVal(q, sel);
        update();
        autosave();
      }),
    );
    update();
  }

  if (q.type === 'single') {
    const cards = [...stage.querySelectorAll('.card-opt')];
    cards.forEach((b, idx) => {
      b.addEventListener('click', () => {
        const same = getVal(q) === b.dataset.id;
        setVal(q, same ? null : b.dataset.id);
        cards.forEach((c) => c.setAttribute('aria-checked', !same && c === b));
        refresh();
        autosave();
      });
      b.addEventListener('keydown', (e) => {
        const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!dir) return;
        e.preventDefault();
        cards[(idx + dir + cards.length) % cards.length].focus();
      });
    });
    refresh();
  }

  if (q.type === 'tags') {
    const field = stage.querySelector('#tag-field');
    const draw = () => {
      const tags = state.answers[q.id] || [];
      stage.querySelector('#tag-list').innerHTML = tags
        .map((t, i) => `<li class="tag" style="--i:${i}">${esc(t)}<button type="button" aria-label="Remove ${esc(t)}" data-rm="${i}">&times;</button></li>`)
        .join('');
      stage.querySelectorAll('[data-rm]').forEach((b) =>
        b.addEventListener('click', () => {
          tags.splice(Number(b.dataset.rm), 1);
          state.answers[q.id] = tags;
          draw();
          autosave();
          field.focus();
        }),
      );
      const full = tags.length >= q.max;
      field.disabled = full;
      field.placeholder = full ? 'That’s plenty — continue when ready' : q.placeholder;
      stage.querySelector('#tag-max').textContent = `${tags.length} of ${q.max}`;
      stage.querySelectorAll('.sugg').forEach((s) => {
        s.hidden = tags.some((t) => t.toLowerCase() === s.dataset.s.toLowerCase());
      });
      refresh();
    };
    const add = (text) => {
      const tags = state.answers[q.id] ? [...state.answers[q.id]] : [];
      const val = text.replace(/\s+/g, ' ').trim().slice(0, 60);
      if (!val || tags.length >= q.max || tags.some((t) => t.toLowerCase() === val.toLowerCase())) return false;
      tags.push(val);
      state.answers[q.id] = tags;
      draw();
      autosave();
      return true;
    };
    wire.commit = () => {
      if (field.value.trim()) {
        field.value.split(',').forEach(add);
        field.value = '';
      }
    };
    field.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ',') && field.value.trim()) {
        e.preventDefault();
        e.stopPropagation();
        wire.commit();
      } else if (e.key === 'Backspace' && !field.value && state.answers[q.id]?.length) {
        state.answers[q.id] = state.answers[q.id].slice(0, -1);
        draw();
        autosave();
      }
    });
    stage.querySelector('#tag-add').addEventListener('click', () => {
      wire.commit();
      field.focus();
    });
    stage.querySelectorAll('.sugg').forEach((s) => s.addEventListener('click', () => add(s.dataset.s)));
    draw();
  }

  if (q.type === 'scale') {
    stage.querySelectorAll('input[type=range]').forEach((r) => {
      const paint = () => {
        r.style.setProperty('--v', `${((r.value - 1) / 4) * 100}%`);
        r.nextElementSibling.textContent = SCALE_WORDS[r.value];
      };
      r.addEventListener('input', () => {
        state.answers[q.id] = { ...state.answers[q.id], [r.dataset.id]: Number(r.value) };
        paint();
        autosave();
      });
      paint();
    });
    refresh();
  }
}

// Global Enter-to-continue (Shift+Enter or plain Enter inside the notes box adds a new line).
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.isComposing || e.defaultPrevented) return;
  const t = e.target;
  if (t.matches?.('textarea, input[type=email], input[name=name], button, a')) return;
  const next = stage.querySelector('[data-act="next"]');
  if (next && !next.disabled) {
    e.preventDefault();
    next.click();
  }
});

// ───────────── Weaving & result ─────────────
const WEAVE_LINES = [
  'Listening to what you love…',
  'Measuring your quiet gifts…',
  'Mapping what the world is asking of you…',
  'Following where value flows…',
  'Reading between your own words…',
  'Testing a few possible Ikigais against your answers…',
  'Connecting what you love to what the world needs…',
  'Choosing the words for your map…',
];

async function weave() {
  clearTimeout(saveTimer); // the completion call below saves everything
  setPhase('weaving');
  progressEl.hidden = true;
  await render(`
    <section class="weaving" aria-live="polite">
      <div class="weave-visual">${venn('weave')}</div>
      <p class="weave-line" id="weave-line">${WEAVE_LINES[0]}</p>
      <p class="muted weave-note" id="weave-note"></p>
    </section>`);
  let i = 0;
  const ticker = setInterval(() => {
    i = (i + 1) % WEAVE_LINES.length;
    const el = document.getElementById('weave-line');
    if (!el) return;
    el.classList.remove('in');
    void el.offsetWidth;
    el.textContent = WEAVE_LINES[i];
    el.classList.add('in');
  }, 2200);
  const slow = setTimeout(() => {
    const n = document.getElementById('weave-note');
    if (n) n.textContent = 'The engine is thinking deeply about your answers. This can take up to a minute.';
  }, 9000);

  const minWait = new Promise((r) => setTimeout(r, reduceMotion ? 600 : 4600));
  let payload;
  let share = '';
  if (STATIC) {
    let result = computeIkigai(state.answers, state.name);
    try {
      const data = await engineCall({ type: 'synthesize' }, 110_000);
      result = mergeSynthesis(result, data.synthesis);
    } catch {
      /* the rule-based result stands */
    }
    payload = { id: state.id, name: state.name, result };
    share = await encodeShare({ n: result.name, a: state.answers, d: new Date().toISOString().slice(0, 10), x: result.ai || undefined });
    const label = (ids) => ids.map((t) => THEMES[t]?.short ?? t).join(' + ');
    const ov = (k) => result.ai?.overlaps[k]?.label || label(result.overlaps[k]);
    const profile = store.get(PROFILE_KEY) || {};
    toSheet({
      type: 'complete', id: state.id, name: state.name, email: state.email || profile.email || '', optIn: !!profile.optIn,
      archetype: result.archetype, ikigai: result.ai?.ikigaiTitle || label(result.center), harmony: result.harmony,
      passion: ov('passion'), mission: ov('mission'), profession: ov('profession'), vocation: ov('vocation'),
      loveWords: result.circles.love.words.join('; '), goodWords: result.circles.good.words.join('; '),
      needsWords: result.circles.needs.words.join('; '), paidWords: result.circles.paid.words.join('; '),
      workStyle: result.workStyle || '', resultLink: `${BASE}#r=${share}`, answers: state.answers,
      engine: result.ai ? 'ai' : 'rules', ikigaiTitle: result.ai?.ikigaiTitle || '', statement: result.statement, insight: result.ai?.insight || '',
    });
  } else {
    try {
      payload = await api(`/api/journeys/${state.id}/complete`, { method: 'POST', body: { answers: state.answers }, timeout: 150_000 });
    } catch {
      payload = { id: state.id, name: state.name, result: computeIkigai(state.answers, state.name), offline: true };
    }
  }
  await minWait;
  clearInterval(ticker);
  clearTimeout(slow);
  store.set(STORE_KEY, { id: state.id, name: state.name, status: payload.offline ? 'in_progress' : 'complete', step: state.step, answers: state.answers, share });
  const shareUrl = STATIC ? `${BASE}#r=${share}` : `${BASE}?r=${encodeURIComponent(state.id)}`;
  if (!payload.offline) history.replaceState(null, '', shareUrl);
  showResult(payload, { own: true, offline: payload.offline, shareUrl });
}

async function loadShared(code) {
  setPhase('weaving');
  progressEl.hidden = true;
  stage.innerHTML = `<section class="weaving"><div class="weave-visual">${venn('weave')}</div><p class="weave-line">Unfolding the map…</p></section>`;
  try {
    const data = await decodeShare(code);
    const saved = store.get(STORE_KEY);
    showResult(
      { id: '', name: data.n, result: mergeSynthesis(computeIkigai(data.a, data.n), data.x) },
      { own: saved?.share === code, completedAt: data.d ? `${data.d} 12:00:00` : undefined, shareUrl: `${BASE}#r=${code}` },
    );
  } catch {
    mapNotFound(false);
  }
}

function mapNotFound(serverDown) {
  setPhase('landing');
  render(`
    <section class="panel center">
      <h2>That map has drifted away.</h2>
      <p class="lede">${esc(serverDown ? 'We couldn’t reach the server just now.' : 'We couldn’t find this Ikigai. The link may be incomplete.')}</p>
      <div class="nav center"><a class="btn btn-primary" href="./">Find your own Ikigai &rarr;</a></div>
    </section>`);
}

async function loadResult(id, own = false) {
  setPhase('weaving');
  stage.innerHTML = `<section class="weaving"><div class="weave-visual">${venn('weave')}</div><p class="weave-line">Unfolding the map…</p></section>`;
  try {
    const data = await api(`/api/results/${encodeURIComponent(id)}`);
    const saved = store.get(STORE_KEY);
    showResult(data, { own: own || saved?.id === id, completedAt: data.completedAt });
  } catch (ex) {
    mapNotFound(ex.status !== 404);
  }
}

function themeChip(id) {
  const t = THEMES[id];
  return t ? `<span class="theme-chip"><span aria-hidden="true">${t.emoji}</span>${esc(t.label)}</span>` : '';
}

function showResult({ id, name, result }, { own = false, offline = false, completedAt, shareUrl = `${BASE}?r=${encodeURIComponent(id)}` } = {}) {
  setPhase('result');
  progressEl.hidden = true;
  const ai = result.ai;
  const first = (name || '').trim().split(/\s+/)[0] || 'Friend';
  const svg = buildDiagramSVG(result, { name: first, date: completedAt ? `${completedAt.replace(' ', 'T')}Z` : new Date() });
  const circleWords = (c) => (result.circles[c].words.length ? result.circles[c].words : ai?.circles[c]?.words || []);

  const steps = ai?.nextSteps?.length
    ? `<ol class="steps">${ai.nextSteps.map((s) => `
        <li><p class="step-when">${esc(s.when)}</p><p class="step-title">${esc(s.title)}</p><p class="step-text">${esc(s.text)}</p></li>`).join('')}</ol>`
    : `<div class="next-step cc-${result.nextStep.circle}">
        <p class="eyebrow">Your next step &middot; ${esc(result.nextStep.title)}</p>
        <p>${esc(result.nextStep.text)}</p>
      </div>`;

  render(`
    <section class="result">
      <header class="result-head">
        <p class="eyebrow">${own ? 'Your reason for being' : `${esc(first)}’s reason for being`}</p>
        <h1>${own ? `${esc(first)}, meet your Ikigai.` : `${esc(first)}’s Ikigai`}</h1>
        <p class="archetype">${esc(result.archetype)}</p>
        <p class="statement">&ldquo;${esc(result.statement)}&rdquo;</p>
        ${ai ? '<p class="engine-badge"><span aria-hidden="true">✦</span> Reasoned from your own words by the Ikigai engine</p>' : ''}
      </header>

      ${offline ? '<p class="notice">We couldn’t save this to the server, so it’s only on this device for now. Try again later from the home page.</p>' : ''}

      <figure class="map-card reveal">
        ${svg}
        <figcaption class="sr-only">Personal Ikigai diagram</figcaption>
      </figure>

      <div class="actions">
        <button class="btn btn-primary" data-act="png">Download my map</button>
        ${offline ? '' : '<button class="btn btn-ghost" data-act="share">Share</button>'}
        ${own ? '<button class="btn btn-ghost" data-act="retake">Retake</button>' : '<a class="btn btn-ghost" href="./">Find your own &rarr;</a>'}
      </div>

      ${ai ? `
      <section class="insight-card">
        <p class="eyebrow">At the centre of your circles</p>
        <h3 class="insight-title">${esc(ai.ikigaiTitle)}</h3>
        ${ai.ikigaiText ? `<p class="insight-lede">${esc(ai.ikigaiText)}</p>` : ''}
        ${ai.insight ? `<div class="insight-noticed"><p class="eyebrow">What the engine noticed</p><p>${esc(ai.insight)}</p></div>` : ''}
      </section>` : ''}

      <section class="block">
        <h3 class="block-title">Your four circles</h3>
        <div class="grid-4">
          ${CIRCLE_ORDER.map((c) => `
            <article class="circle-card cc-${c}">
              <p class="cc-label"><span class="dot"></span>${esc(CIRCLES[c].title)}</p>
              <p class="cc-sentence">${esc(result.sentences[c])}</p>
              ${circleWords(c).length ? `<p class="cc-words">${circleWords(c).map((w) => `<span>&ldquo;${esc(w)}&rdquo;</span>`).join('')}</p>` : ''}
              <div class="cc-themes">${result.circles[c].top.slice(0, 2).map((t) => themeChip(t.id)).join('')}</div>
            </article>`).join('')}
        </div>
      </section>

      <section class="block">
        <h3 class="block-title">Where your circles overlap</h3>
        <div class="grid-4">
          ${Object.values(OVERLAPS).map((o) => `
            <article class="overlap-card ov-${o.id}">
              ${ai?.overlaps[o.id] ? `
                <p class="ov-kicker">${esc(o.label)}</p>
                <p class="ov-label">${esc(ai.overlaps[o.id].label)}</p>
                <p class="ov-insight">${esc(ai.overlaps[o.id].insight)}</p>
                <p class="ov-meaning">${esc(o.meaning)}</p>` : `
                <p class="ov-label">${esc(o.label)}</p>
                <p class="ov-meaning">${esc(o.meaning)}</p>
                <div class="cc-themes">${result.overlaps[o.id].map(themeChip).join('')}</div>`}
            </article>`).join('')}
        </div>
      </section>

      <section class="block two-col">
        <article class="harmony-card">
          <h3 class="block-title">Circle harmony</h3>
          <div class="harmony-ring" style="--p:${result.harmony}">
            <span><strong>${result.harmony}</strong>%</span>
          </div>
          <p class="muted">How strongly your core themes, ${esc(THEMES[result.center[0]].short)} and ${esc(THEMES[result.center[1]].short)}, show up in all four circles.</p>
          <ul class="bars">
            ${CIRCLE_ORDER.map((c) => `
              <li class="bar-${c}"><span>${esc(CIRCLES[c].key)}</span><span class="bar"><i style="--w:${Math.max(4, result.balance[c])}%"></i></span><span>${result.balance[c]}</span></li>`).join('')}
          </ul>
        </article>
        <article class="paths-card">
          <h3 class="block-title">Paths worth exploring</h3>
          <ol class="paths">${ai?.paths?.length
            ? ai.paths.map((p) => `<li><span><strong>${esc(p.title)}</strong>${p.why ? `<span class="why">${esc(p.why)}</span>` : ''}</span></li>`).join('')
            : result.paths.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
          <h3 class="block-title steps-title">Your next steps</h3>
          ${steps}
        </article>
      </section>

      <p class="closing"><span lang="ja">生き甲斐</span> isn&rsquo;t found once. It&rsquo;s tended, like a garden. Come back and retake this whenever life shifts.</p>
    </section>`, () => {
    const svgEl = stage.querySelector('.map-card svg');
    stage.querySelector('[data-act="png"]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Painting…';
      try {
        const blob = await svgToPngBlob(svgEl, 2);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ikigai-${first.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'map'}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        toast('Your Ikigai map is downloading.');
      } catch {
        toast('Sorry, the download didn’t work. Try a screenshot instead.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Download my map';
      }
    });
    stage.querySelector('[data-act="share"]')?.addEventListener('click', async () => {
      const data = { title: `${first}’s Ikigai`, text: `${result.archetype}: ${result.statement}`, url: shareUrl };
      try {
        if (navigator.share) return await navigator.share(data);
        await navigator.clipboard.writeText(shareUrl);
        toast('Link copied. Share it with someone who gets you.');
      } catch (err) {
        if (err?.name !== 'AbortError') toast(shareUrl);
      }
    });
    stage.querySelector('[data-act="retake"]')?.addEventListener('click', () => {
      store.del(STORE_KEY);
      followups.clear();
      history.replaceState(null, '', location.pathname);
      profile();
    });
  });
}

// ───────────── Boot ─────────────
STATIC = await detectStatic();
document.documentElement.dataset.mode = STATIC ? 'static' : 'server';
const params = new URLSearchParams(location.search);
const sharedCode = location.hash.startsWith('#r=') ? location.hash.slice(3) : '';
if (sharedCode) loadShared(sharedCode);
else if (!STATIC && params.get('r')) loadResult(params.get('r'));
else landing();
