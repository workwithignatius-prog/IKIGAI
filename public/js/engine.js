// Ikigai scoring engine. Pure functions, shared by the browser and the server.
import { QUESTIONS, THEMES, THEME_IDS, CIRCLE_ORDER, OVERLAPS } from './questions.js';

const SMOOTH = 0.05; // keeps an empty circle from zeroing out an overlap entirely

const keywordRegexes = Object.fromEntries(
  THEME_IDS.map((id) => [id, THEMES[id].keywords.map((k) => new RegExp(`\\b${k}`, 'i'))]),
);

export function themesInText(text) {
  const found = [];
  for (const id of THEME_IDS) {
    if (keywordRegexes[id].some((re) => re.test(text))) found.push(id);
  }
  return found;
}

function emptyScores() {
  return Object.fromEntries(THEME_IDS.map((t) => [t, 0]));
}

function addThemes(bucket, themes, total) {
  if (!themes || !themes.length) return;
  const each = themes.length === 1 ? total : total * 0.7;
  for (const t of themes) if (t in bucket) bucket[t] += each;
}

/** Normalise and sanitise raw answers coming from the client. */
export function sanitizeAnswers(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const q of QUESTIONS) {
    const a = raw[q.id];
    if (a == null) continue;
    if (q.type === 'chips') {
      if (!Array.isArray(a)) continue;
      const valid = new Set(q.options.map((o) => o.id));
      out[q.id] = [...new Set(a.filter((x) => valid.has(x)))].slice(0, q.max);
    } else if (q.type === 'single') {
      if (q.options.some((o) => o.id === a)) out[q.id] = a;
    } else if (q.type === 'tags') {
      if (!Array.isArray(a)) continue;
      out[q.id] = a
        .filter((x) => typeof x === 'string')
        .map((x) => x.replace(/\s+/g, ' ').trim().slice(0, 60))
        .filter(Boolean)
        .slice(0, q.max);
    } else if (q.type === 'scale') {
      if (typeof a !== 'object') continue;
      const v = {};
      for (const item of q.items) {
        const n = Number(a[item.id]);
        if (Number.isFinite(n)) v[item.id] = Math.min(5, Math.max(1, Math.round(n)));
      }
      out[q.id] = v;
    }
  }
  return out;
}

export function scoreAnswers(answers) {
  const raw = Object.fromEntries(CIRCLE_ORDER.map((c) => [c, emptyScores()]));
  const words = Object.fromEntries(CIRCLE_ORDER.map((c) => [c, []]));

  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (a == null) continue;
    const bucket = raw[q.circle];
    if (q.type === 'chips') {
      for (const id of a) addThemes(bucket, q.options.find((o) => o.id === id)?.themes, 3);
    } else if (q.type === 'single') {
      addThemes(bucket, q.options.find((o) => o.id === a)?.themes, 3);
    } else if (q.type === 'scale') {
      for (const item of q.items) {
        const v = a[item.id] ?? 3;
        addThemes(bucket, item.themes, (v - 1) * 0.75);
      }
    } else if (q.type === 'tags') {
      for (const phrase of a) {
        if (q.words) words[q.circle].push(phrase);
        addThemes(bucket, themesInText(phrase), 1.5);
      }
    }
  }

  const norm = {};
  for (const c of CIRCLE_ORDER) {
    const max = Math.max(...Object.values(raw[c]), 0);
    norm[c] = Object.fromEntries(THEME_IDS.map((t) => [t, max > 0 ? raw[c][t] / max : 0]));
  }
  return { raw, norm, words };
}

function ranked(scoreMap) {
  return Object.entries(scoreMap)
    .sort((a, b) => b[1] - a[1] || THEME_IDS.indexOf(a[0]) - THEME_IDS.indexOf(b[0]))
    .map(([id, score]) => ({ id, score: Math.round(score * 1000) / 1000 }));
}

function blend(norm, circles) {
  const out = {};
  for (const t of THEME_IDS) {
    let product = 1;
    for (const c of circles) product *= (norm[c][t] + SMOOTH) / (1 + SMOOTH);
    out[t] = Math.pow(product, 1 / circles.length);
  }
  return out;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function buildPaths(a, b, workStyle) {
  const A = THEMES[a];
  const B = THEMES[b];
  const paths = [
    `${A.roles[0]} focused on ${B.focus}`,
    `${B.roles[0]} with a ${A.focus} edge`,
    `${A.roles[1]}`,
    `${B.roles[2]}`,
  ];
  const styled = {
    employed: `A role at an organisation working on ${B.focus}`,
    freelance: `Freelance ${A.roles[0].toLowerCase()} for ${B.focus} clients`,
    business: `Your own venture where ${A.focus} meets ${B.focus}`,
    creator: `Build an audience around ${A.focus} × ${B.focus}`,
    impact: `A mission-driven organisation using ${A.focus} for ${B.focus}`,
    mix: `A portfolio career: ${A.focus} as your craft, ${B.focus} as your cause`,
  }[workStyle];
  if (styled) paths.splice(0, 1, styled); // the styled path supersedes the generic first one
  return [...new Set(paths)].slice(0, 5);
}

const NEXT_STEPS = {
  love: {
    title: 'Check the joy factor',
    text: (A) => `You’re capable and useful here, but make sure you’d enjoy the day-to-day. Spend one weekend doing ${A.focus} work purely for fun, and notice whether time disappears.`,
  },
  good: {
    title: 'Sharpen the skill',
    text: (A) => `Your heart is already in it — now build mastery. Pick one skill within ${A.focus} and practise it deliberately for 30 days. Share what you make.`,
  },
  needs: {
    title: 'Find who it serves',
    text: (A) => `Talk to five people who might benefit from your ${A.focus} work. Ask what they struggle with, and listen for the moment where you fit.`,
  },
  paid: {
    title: 'Test the market',
    text: (A) => `Offer one small paid version of this — a session, a product, a workshop — within the next month. Real money is the clearest feedback there is.`,
  },
};

export function computeIkigai(rawAnswers, name = '') {
  const answers = sanitizeAnswers(rawAnswers);
  const { norm, words } = scoreAnswers(answers);

  const circles = {};
  for (const c of CIRCLE_ORDER) {
    circles[c] = {
      top: ranked(norm[c]).filter((x) => x.score > 0).slice(0, 3),
      words: words[c].slice(0, 4),
    };
  }

  const overlaps = {};
  for (const [key, o] of Object.entries(OVERLAPS)) {
    overlaps[key] = ranked(blend(norm, o.circles)).slice(0, 2).map((x) => x.id);
  }

  const centerRank = ranked(blend(norm, CIRCLE_ORDER));
  const center = [centerRank[0].id, centerRank[1].id];
  const [a, b] = center;
  const A = THEMES[a];
  const B = THEMES[b];

  // How well the two core themes are supported by each circle (0..100).
  const balance = Object.fromEntries(
    CIRCLE_ORDER.map((c) => [c, Math.round(((norm[c][a] + norm[c][b]) / 2) * 100)]),
  );
  const weakest = CIRCLE_ORDER.reduce((w, c) => (balance[c] < balance[w] ? c : w), CIRCLE_ORDER[0]);
  const harmony = Math.round(
    (centerRank[0].score * 0.65 + centerRank[1].score * 0.35) * 100,
  );

  const topOf = (c) => THEMES[circles[c].top[0]?.id ?? a];
  const workStyle = answers.paid_style || null;
  const firstName = String(name || '').trim().split(/\s+/)[0] || '';

  return {
    version: 1,
    name: firstName,
    archetype: a === b ? `The ${A.noun}` : `The ${B.adj} ${A.noun}`,
    center,
    harmony,
    statement: `${A.verb} — through ${B.through}.`,
    sentences: {
      love: `You come alive ${topOf('love').doing}.`,
      good: `Your gift is ${topOf('good').gift}.`,
      needs: `The world needs you for ${topOf('needs').need}.`,
      paid: `People will pay you for ${topOf('paid').paid}.`,
    },
    circles,
    overlaps,
    balance,
    nextStep: { circle: weakest, title: NEXT_STEPS[weakest].title, text: NEXT_STEPS[weakest].text(A) },
    paths: buildPaths(a, b, workStyle).map(cap),
    workStyle,
  };
}
