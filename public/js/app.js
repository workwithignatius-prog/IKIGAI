import { CIRCLES, CIRCLE_ORDER, OVERLAPS, QUESTIONS, THEMES } from './questions.js';
import { computeIkigai } from './engine.js';
import { buildDiagramSVG, svgToPngBlob, esc } from './diagram.js';

const STORE_KEY = 'ikigai.journey.v1';
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
  store.set(STORE_KEY, { id: state.id, name: state.name, step: state.step, answers: state.answers, status: 'in_progress' });
}

// ───────────── API ─────────────
async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

let saveTimer;
function autosave() {
  persistLocal();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!state.id) return;
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
        <p class="lede">The Japanese call it <strong>ikigai</strong>: the quiet place where four circles meet. In about five minutes, fifteen questions will trace your circles and draw the map of where they overlap.</p>
        <div class="cta-row">
          ${resume ? `
            <button class="btn btn-primary" data-act="resume" data-autofocus>Continue your journey, ${esc(saved.name?.split(' ')[0] || 'friend')} &rarr;</button>
            <button class="btn btn-ghost" data-act="start">Start fresh</button>` : done ? `
            <button class="btn btn-primary" data-act="view" data-autofocus>See your Ikigai again &rarr;</button>
            <button class="btn btn-ghost" data-act="start">Take it again</button>` : `
            <button class="btn btn-primary" data-act="start" data-autofocus>Begin the journey &rarr;</button>`}
        </div>
        <ul class="facts">
          <li><span>15</span> questions</li>
          <li><span>4</span> circles</li>
          <li><span>~5</span> minutes</li>
          <li><span>1</span> personal map</li>
        </ul>
      </div>
    </section>`, () => {
    stage.querySelector('[data-act="start"]')?.addEventListener('click', profile);
    stage.querySelector('[data-act="resume"]')?.addEventListener('click', () => {
      Object.assign(state, { id: saved.id, name: saved.name, step: Math.min(saved.step || 0, FLOW.length - 1), answers: saved.answers || {} });
      showStep();
    });
    stage.querySelector('[data-act="view"]')?.addEventListener('click', () => loadResult(saved.id, true));
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
          <span>I agree that my name, email and answers are saved so my Ikigai can be generated and shown to me.</span>
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
        const { id } = await api('/api/journeys', { method: 'POST', body: { name, email, consent: true, optIn: !!fd.get('optIn') } });
        store.set(PROFILE_KEY, { name, email });
        Object.assign(state, { id, name, step: 0, answers: {} });
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

function questionNumber(q) {
  return QUESTIONS.indexOf(q) + 1;
}

function isAnswered(q) {
  const a = state.answers[q.id];
  if (q.type === 'chips') return Array.isArray(a) && a.length > 0;
  if (q.type === 'single') return !!a;
  return true; // tags are optional, scales always have a value
}

function question(q) {
  if (q.type === 'scale' && !state.answers[q.id]) {
    state.answers[q.id] = Object.fromEntries(q.items.map((i) => [i.id, 3]));
  }
  const num = String(questionNumber(q)).padStart(2, '0');
  render(`
    <section class="panel question q-${q.type}">
      <p class="q-meta"><span class="q-num">${num}</span><span class="q-total">/ ${TOTAL_Q}</span></p>
      <h2 id="q-title">${esc(q.title)}</h2>
      <p class="hint">${esc(q.hint)}</p>
      <div class="q-body">${body(q)}</div>
      <div class="nav">
        <button class="btn btn-ghost" data-act="back">&larr; Back</button>
        <span class="enter-hint" aria-hidden="true">press <kbd>Enter &crarr;</kbd></span>
        <button class="btn btn-primary" data-act="next">Continue &rarr;</button>
      </div>
    </section>`, () => wire(q));
}

function body(q) {
  const a = state.answers[q.id];
  if (q.type === 'chips') {
    const sel = new Set(a || []);
    return `
      <div class="chips" role="group" aria-labelledby="q-title">
        ${q.options.map((o, i) => `
          <button type="button" class="chip" data-id="${o.id}" aria-pressed="${sel.has(o.id)}" style="--i:${i}" ${i === 0 ? 'data-autofocus' : ''}>
            <span class="chip-emoji" aria-hidden="true">${o.emoji}</span><span>${esc(o.label)}</span>
          </button>`).join('')}
      </div>
      <p class="counter" aria-live="polite"><span id="count">${sel.size}</span> of ${q.max} chosen</p>`;
  }
  if (q.type === 'single') {
    return `
      <div class="cards" role="radiogroup" aria-labelledby="q-title">
        ${q.options.map((o, i) => `
          <button type="button" class="card-opt" role="radio" data-id="${o.id}" aria-checked="${a === o.id}" style="--i:${i}" ${(a ? a === o.id : i === 0) ? 'data-autofocus' : ''}>
            <span class="card-emoji" aria-hidden="true">${o.emoji}</span><span>${esc(o.label)}</span>
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

  const refresh = () => {
    next.disabled = !isAnswered(q);
    if (q.type === 'tags') next.innerHTML = (state.answers[q.id]?.length ? 'Continue' : 'Skip for now') + ' &rarr;';
  };

  next.addEventListener('click', () => {
    if (q.type === 'tags') commitTagField(q);
    if (isAnswered(q)) go(1);
  });

  if (q.type === 'chips') {
    const counter = stage.querySelector('.counter');
    const update = () => {
      const sel = state.answers[q.id] || [];
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
        const sel = state.answers[q.id] ? [...state.answers[q.id]] : [];
        const i = sel.indexOf(b.dataset.id);
        if (i >= 0) sel.splice(i, 1);
        else if (sel.length < q.max) sel.push(b.dataset.id);
        else {
          counter.classList.remove('shake');
          void counter.offsetWidth;
          counter.classList.add('shake');
          return;
        }
        state.answers[q.id] = sel;
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
        state.answers[q.id] = b.dataset.id;
        cards.forEach((c) => c.setAttribute('aria-checked', c === b));
        refresh();
        autosave();
        clearTimeout(wire.adv);
        wire.adv = setTimeout(() => go(1), reduceMotion ? 120 : 420);
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

function commitTagField() {
  wire.commit?.();
}

// Global Enter-to-continue.
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
async function weave() {
  clearTimeout(saveTimer); // the completion call below saves everything
  setPhase('weaving');
  progressEl.hidden = true;
  const lines = [
    'Listening to what you love…',
    'Measuring your quiet gifts…',
    'Mapping what the world is asking for…',
    'Following where value flows…',
    'Weaving your circles together…',
  ];
  await render(`
    <section class="weaving" aria-live="polite">
      <div class="weave-visual">${venn('weave')}</div>
      <p class="weave-line" id="weave-line">${lines[0]}</p>
    </section>`);
  let i = 0;
  const ticker = setInterval(() => {
    i = Math.min(i + 1, lines.length - 1);
    const el = document.getElementById('weave-line');
    if (el) {
      el.classList.remove('in');
      void el.offsetWidth;
      el.textContent = lines[i];
      el.classList.add('in');
    }
  }, 900);

  const minWait = new Promise((r) => setTimeout(r, reduceMotion ? 600 : 4600));
  let payload;
  try {
    payload = await api(`/api/journeys/${state.id}/complete`, { method: 'POST', body: { answers: state.answers } });
  } catch {
    payload = { id: state.id, name: state.name, result: computeIkigai(state.answers, state.name), offline: true };
  }
  await minWait;
  clearInterval(ticker);
  store.set(STORE_KEY, { id: state.id, name: state.name, status: payload.offline ? 'in_progress' : 'complete', step: state.step, answers: state.answers });
  if (!payload.offline) history.replaceState(null, '', `/?r=${encodeURIComponent(state.id)}`);
  showResult(payload, { own: true, offline: payload.offline });
}

async function loadResult(id, own = false) {
  setPhase('weaving');
  stage.innerHTML = `<section class="weaving"><div class="weave-visual">${venn('weave')}</div><p class="weave-line">Unfolding the map…</p></section>`;
  try {
    const data = await api(`/api/results/${encodeURIComponent(id)}`);
    const saved = store.get(STORE_KEY);
    showResult(data, { own: own || saved?.id === id, completedAt: data.completedAt });
  } catch (ex) {
    setPhase('landing');
    render(`
      <section class="panel center">
        <h2>That map has drifted away.</h2>
        <p class="lede">${esc(ex.status === 404 ? 'We couldn’t find this Ikigai. The link may be incomplete.' : 'We couldn’t reach the server just now.')}</p>
        <div class="nav center"><a class="btn btn-primary" href="/">Find your own Ikigai &rarr;</a></div>
      </section>`);
  }
}

function themeChip(id) {
  const t = THEMES[id];
  return t ? `<span class="theme-chip"><span aria-hidden="true">${t.emoji}</span>${esc(t.label)}</span>` : '';
}

function showResult({ id, name, result }, { own = false, offline = false, completedAt } = {}) {
  setPhase('result');
  progressEl.hidden = true;
  const first = (name || '').trim().split(/\s+/)[0] || 'Friend';
  const svg = buildDiagramSVG(result, { name: first, date: completedAt ? `${completedAt.replace(' ', 'T')}Z` : new Date() });
  const shareUrl = `${location.origin}/?r=${encodeURIComponent(id)}`;

  render(`
    <section class="result">
      <header class="result-head">
        <p class="eyebrow">${own ? 'Your reason for being' : `${esc(first)}’s reason for being`}</p>
        <h1>${own ? `${esc(first)}, meet your Ikigai.` : `${esc(first)}’s Ikigai`}</h1>
        <p class="archetype">${esc(result.archetype)}</p>
        <p class="statement">&ldquo;${esc(result.statement)}&rdquo;</p>
      </header>

      ${offline ? '<p class="notice">We couldn’t save this to the server, so it’s only on this device for now. Try again later from the home page.</p>' : ''}

      <figure class="map-card reveal">
        ${svg}
        <figcaption class="sr-only">Personal Ikigai diagram</figcaption>
      </figure>

      <div class="actions">
        <button class="btn btn-primary" data-act="png">Download my map</button>
        ${offline ? '' : '<button class="btn btn-ghost" data-act="share">Share</button>'}
        ${own ? '<button class="btn btn-ghost" data-act="retake">Retake</button>' : '<a class="btn btn-ghost" href="/">Find your own &rarr;</a>'}
      </div>

      <section class="block">
        <h3 class="block-title">Your four circles</h3>
        <div class="grid-4">
          ${CIRCLE_ORDER.map((c) => `
            <article class="circle-card cc-${c}">
              <p class="cc-label"><span class="dot"></span>${esc(CIRCLES[c].title)}</p>
              <p class="cc-sentence">${esc(result.sentences[c])}</p>
              ${result.circles[c].words.length ? `<p class="cc-words">${result.circles[c].words.map((w) => `<span>&ldquo;${esc(w)}&rdquo;</span>`).join('')}</p>` : ''}
              <div class="cc-themes">${result.circles[c].top.slice(0, 2).map((t) => themeChip(t.id)).join('')}</div>
            </article>`).join('')}
        </div>
      </section>

      <section class="block">
        <h3 class="block-title">Where your circles overlap</h3>
        <div class="grid-4">
          ${Object.values(OVERLAPS).map((o) => `
            <article class="overlap-card ov-${o.id}">
              <p class="ov-label">${esc(o.label)}</p>
              <p class="ov-meaning">${esc(o.meaning)}</p>
              <div class="cc-themes">${result.overlaps[o.id].map(themeChip).join('')}</div>
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
          <ol class="paths">${result.paths.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
          <div class="next-step cc-${result.nextStep.circle}">
            <p class="eyebrow">Your next step &middot; ${esc(result.nextStep.title)}</p>
            <p>${esc(result.nextStep.text)}</p>
          </div>
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
      history.replaceState(null, '', '/');
      profile();
    });
  });
}

// ───────────── Boot ─────────────
const params = new URLSearchParams(location.search);
if (params.get('r')) loadResult(params.get('r'));
else landing();
