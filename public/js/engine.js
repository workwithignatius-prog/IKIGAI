// Ikigai scoring engine. Pure functions, shared by the browser, the Node server
// and the Google Apps Script backend (bundled by scripts/build-gas.mjs).
import { QUESTIONS, THEMES, THEME_IDS, THEME_DETAILS, CIRCLES, CIRCLE_ORDER, OVERLAPS, CAREERS } from './questions.js';

const SMOOTH = 0.05; // keeps an empty circle from zeroing out an overlap entirely
const NOTE_MAX = 400;

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

const cleanText = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

function emptyScores() {
  return Object.fromEntries(THEME_IDS.map((t) => [t, 0]));
}

function addThemes(bucket, themes, total) {
  if (!themes || !themes.length) return;
  const each = themes.length === 1 ? total : total * 0.7;
  for (const t of themes) if (t in bucket) bucket[t] += each;
}

/** Validate a generated (adaptive) question definition. Returns a clean copy or null. */
export function validateQuestionDef(def, circle) {
  if (!def || typeof def !== 'object') return null;
  const title = cleanText(def.title, 200);
  if (!title) return null;
  const seen = new Set();
  const options = (Array.isArray(def.options) ? def.options : [])
    .map((o, i) => {
      const label = cleanText(o && o.label, 80);
      if (!label || seen.has(label.toLowerCase())) return null;
      seen.add(label.toLowerCase());
      const themes = (Array.isArray(o.themes) ? o.themes : []).filter((t) => THEME_IDS.includes(t)).slice(0, 2);
      return {
        id: /^[a-z0-9_-]{1,24}$/i.test(o.id || '') ? o.id : `o${i}`,
        label,
        emoji: cleanText(o.emoji, 8) || '✦',
        themes,
      };
    })
    .filter(Boolean)
    .slice(0, 8);
  if (options.length < 2) return null;
  const type = def.type === 'single' ? 'single' : 'chips';
  return {
    circle,
    type,
    max: type === 'chips' ? Math.min(3, Math.max(1, Number(def.max) || 2)) : 1,
    title,
    hint: cleanText(def.hint, 200),
    note: cleanText(def.note, 120) || 'Or answer in your own words…',
    options,
    source: def.source === 'ai' ? 'ai' : 'local',
  };
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
      out[q.id] = a.map((x) => cleanText(x, 60)).filter(Boolean).slice(0, q.max);
    } else if (q.type === 'scale') {
      if (typeof a !== 'object') continue;
      const v = {};
      for (const item of q.items) {
        const n = Number(a[item.id]);
        if (Number.isFinite(n)) v[item.id] = Math.min(5, Math.max(1, Math.round(n)));
      }
      out[q.id] = v;
    } else if (q.type === 'adaptive') {
      const def = validateQuestionDef(a.def, q.circle);
      if (!def) continue;
      const ids = new Set(def.options.map((o) => o.id));
      const value = def.type === 'single'
        ? (ids.has(a.value) ? a.value : null)
        : [...new Set((Array.isArray(a.value) ? a.value : []).filter((x) => ids.has(x)))].slice(0, def.max);
      out[q.id] = { def, value };
    }
  }
  if (raw.notes && typeof raw.notes === 'object') {
    const notes = {};
    for (const q of QUESTIONS) {
      const n = cleanText(raw.notes[q.id], NOTE_MAX);
      if (n) notes[q.id] = n;
    }
    if (Object.keys(notes).length) out.notes = notes;
  }
  return out;
}

export function scoreAnswers(answers) {
  const raw = Object.fromEntries(CIRCLE_ORDER.map((c) => [c, emptyScores()]));
  const words = Object.fromEntries(CIRCLE_ORDER.map((c) => [c, []]));
  const notes = answers.notes || {};

  for (const q of QUESTIONS) {
    const a = answers[q.id];
    const bucket = raw[q.circle];
    if (notes[q.id]) addThemes(bucket, themesInText(notes[q.id]), 2);
    if (a == null) continue;
    if (q.type === 'chips') {
      for (const id of a) addThemes(bucket, q.options.find((o) => o.id === id)?.themes, 3);
    } else if (q.type === 'single') {
      addThemes(bucket, q.options.find((o) => o.id === a)?.themes, 3);
    } else if (q.type === 'scale') {
      for (const item of q.items) addThemes(bucket, item.themes, ((a[item.id] ?? 3) - 1) * 0.75);
    } else if (q.type === 'tags') {
      for (const phrase of a) {
        if (q.words) words[q.circle].push(phrase);
        addThemes(bucket, themesInText(phrase), 1.5);
      }
    } else if (q.type === 'adaptive') {
      const chosen = Array.isArray(a.value) ? a.value : a.value ? [a.value] : [];
      for (const id of chosen) addThemes(bucket, a.def.options.find((o) => o.id === id)?.themes, 3.5);
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

/** Overall theme ranking across the circles answered so far. */
function overallTop(norm, circles) {
  const sum = Object.fromEntries(THEME_IDS.map((t) => [t, circles.reduce((acc, c) => acc + norm[c][t], 0)]));
  return ranked(sum).map((x) => x.id);
}

/**
 * Rule-based adaptive question for a circle, used when the AI engine is unavailable.
 * It still adapts: options come from the themes this person has shown so far.
 */
export function localFollowup(circle, rawAnswers) {
  const answers = sanitizeAnswers(rawAnswers);
  const { norm } = scoreAnswers(answers);
  const answered = CIRCLE_ORDER.slice(0, CIRCLE_ORDER.indexOf(circle) + 1);
  const inCircle = ranked(norm[circle]).filter((x) => x.score > 0).map((x) => x.id);
  const overall = overallTop(norm, answered);
  const pick = (list, n) => [...new Set([...list, ...overall, ...THEME_IDS])].slice(0, n);

  const opt = (theme, label, i) => ({ id: `${theme}-${i}`, label, emoji: THEMES[theme].emoji, themes: [theme] });
  let def;
  if (circle === 'love' || circle === 'good') {
    const [a, b] = pick(inCircle, 2);
    const options = [
      ...THEME_DETAILS[a].facets.map((f, i) => opt(a, f, i)),
      ...THEME_DETAILS[b].facets.slice(0, 3).map((f, i) => opt(b, f, i)),
    ];
    def = circle === 'love'
      ? { title: `You enjoy ${THEMES[a].short.toLowerCase()}. Which part do you enjoy most?`, hint: 'Pick up to 2.', type: 'chips', max: 2, options }
      : { title: 'Which of these are you best at?', hint: 'Pick up to 2.', type: 'chips', max: 2, options };
  } else {
    const themes = pick(overall, 3);
    const key = circle === 'needs' ? 'audiences' : 'offers';
    const options = themes.flatMap((t) => THEME_DETAILS[t][key].map((x, i) => opt(t, x, i))).slice(0, 8);
    def = circle === 'needs'
      ? { title: 'Which of these feels most like your cause?', hint: 'Pick one.', type: 'single', options }
      : { title: 'What would someone most likely pay you for first?', hint: 'Pick up to 2.', type: 'chips', max: 2, options };
  }
  return validateQuestionDef({ ...def, source: 'local' }, circle);
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** How well a mix of themes is supported by each circle (true = clearly supported). */
function circleChecks(themeWeights, norm) {
  const entries = Object.entries(themeWeights).filter(([t]) => THEME_IDS.includes(t));
  const total = entries.reduce((acc, [, w]) => acc + w, 0) || 1;
  return Object.fromEntries(
    CIRCLE_ORDER.map((c) => [c, entries.reduce((acc, [t, w]) => acc + w * norm[c][t], 0) / total >= 0.35]),
  );
}

/** Rank the careers database against this person's four circles. */
function matchCareers(norm, workStyle, count = 5) {
  const core = blend(norm, CIRCLE_ORDER);
  const scored = CAREERS.map((career) => {
    const entries = Object.entries(career.themes);
    const total = entries.reduce((acc, [, w]) => acc + w, 0);
    let raw = entries.reduce((acc, [t, w]) => acc + w * core[t], 0) / total;
    if (workStyle && career.modes.includes(workStyle)) raw += 0.06;
    const fits = Object.values(circleChecks(career.themes, norm)).filter(Boolean).length;
    if (fits < 2) raw -= 0.12; // a real Ikigai career should satisfy several circles
    return { career, raw };
  }).sort((x, y) => y.raw - x.raw);

  // Keep the list varied: at most two careers rooted in the same main theme.
  const perTheme = {};
  const picked = [];
  for (const item of scored) {
    const main = Object.keys(item.career.themes)[0];
    if ((perTheme[main] || 0) >= 2) continue;
    perTheme[main] = (perTheme[main] || 0) + 1;
    picked.push(item);
    if (picked.length === count) break;
  }

  return picked.map(({ career, raw }) => {
    const checks = circleChecks(career.themes, norm);
    const fits = CIRCLE_ORDER.filter((c) => checks[c]).length;
    const main = Object.keys(career.themes).slice(0, 2).map((t) => THEMES[t].label.toLowerCase());
    return {
      id: career.id,
      title: career.title,
      match: Math.min(97, Math.round(40 + 58 * raw)),
      why: fits >= 2
        ? `Uses your strengths in ${main.join(' and ')}, and fits ${fits} of your 4 circles.`
        : `Builds on your interest in ${main.join(' and ')}.`,
      does: career.does,
      start: career.start,
      themes: Object.keys(career.themes),
      circles: checks,
    };
  });
}

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
    text: () => `Offer one small paid version of this — a session, a product, a workshop — within the next month. Real money is the clearest feedback there is.`,
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
  const harmony = Math.round((centerRank[0].score * 0.65 + centerRank[1].score * 0.35) * 100);

  const topOf = (c) => THEMES[circles[c].top[0]?.id ?? a];
  const workStyle = answers.paid_style || null;
  const careers = matchCareers(norm, workStyle);
  const firstName = String(name || '').trim().split(/\s+/)[0] || '';

  return {
    version: 2,
    name: firstName,
    archetype: a === b ? `The ${A.noun}` : `The ${B.adj} ${A.noun}`,
    center,
    harmony,
    statement: `${A.verb.charAt(0).toLowerCase()}${A.verb.slice(1)} through ${B.through}`,
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
    careers,
    plan: [
      { when: 'This week', title: 'Test-drive your top match', text: `${careers[0].title}: ${careers[0].start}` },
      { when: 'This month', title: NEXT_STEPS[weakest].title, text: NEXT_STEPS[weakest].text(A) },
      { when: 'In 90 days', title: 'Make it official', text: `Pick one of your top careers (${careers[0].title} or ${careers[1].title}) and land your first paid project, interview or certificate in it.` },
    ],
    workStyle,
    ai: null,
  };
}

// ───────────── AI synthesis → result ─────────────

const OVERLAP_KEYS = Object.keys(OVERLAPS);

/** Validate the engine's synthesis. Returns a clean object or null. */
export function validateSynthesis(x) {
  if (!x || typeof x !== 'object') return null;
  const t = (v, max) => cleanText(v, max);
  const out = {
    archetype: t(x.archetype, 60),
    statement: t(x.statement, 220),
    ikigaiTitle: t(x.ikigai_title, 40),
    ikigaiText: t(x.ikigai_description, 700),
    insight: t(x.insight, 900),
    coreThemes: (Array.isArray(x.core_themes) ? x.core_themes : []).filter((id) => THEME_IDS.includes(id)).slice(0, 2),
    overlaps: {},
    circles: {},
    careers: [],
    nextSteps: [],
  };
  if (!out.archetype || !out.statement || !out.ikigaiTitle) return null;
  for (const k of OVERLAP_KEYS) {
    const o = x[k] || {};
    out.overlaps[k] = { label: t(o.label, 32), insight: t(o.insight, 320) };
    if (!out.overlaps[k].label) return null;
  }
  for (const c of CIRCLE_ORDER) {
    const o = (x.circles || {})[c] || {};
    out.circles[c] = {
      sentence: t(o.sentence, 220),
      words: (Array.isArray(o.words) ? o.words : []).map((w) => t(w, 28)).filter(Boolean).slice(0, 2),
    };
  }
  out.careers = (Array.isArray(x.careers) ? x.careers : [])
    .map((c) => ({
      title: t(c && c.title, 70),
      match: Math.max(40, Math.min(98, Math.round(Number(c && c.match) || 0))),
      why: t(c && c.why, 260),
      does: t(c && (c.day_to_day ?? c.does), 220),
      start: t(c && (c.first_step ?? c.start), 260),
      themes: (Array.isArray(c && c.themes) ? c.themes : []).filter((id) => THEME_IDS.includes(id)).slice(0, 3),
    }))
    .filter((c) => c.title && c.why)
    .sort((p, q) => q.match - p.match)
    .slice(0, 5);
  if (out.careers.length < 3) return null;
  out.nextSteps = (Array.isArray(x.next_steps) ? x.next_steps : [])
    .map((s) => ({ when: t(s && s.when, 30), title: t(s && s.title, 80), text: t(s && s.text, 320) }))
    .filter((s) => s.title && s.text)
    .slice(0, 3);
  return out;
}

/** Convert an already-validated synthesis (e.g. from a share link) back to the raw shape, so it is re-validated. */
function toRawSynthesis(ai) {
  const o = ai.overlaps || {};
  return {
    archetype: ai.archetype,
    statement: ai.statement,
    ikigai_title: ai.ikigaiTitle,
    ikigai_description: ai.ikigaiText,
    insight: ai.insight,
    core_themes: ai.coreThemes,
    passion: o.passion,
    mission: o.mission,
    profession: o.profession,
    vocation: o.vocation,
    circles: ai.circles,
    careers: ai.careers,
    next_steps: ai.nextSteps,
  };
}

/** Layer a validated synthesis on top of the deterministic result. */
export function mergeSynthesis(result, synthesis, rawAnswers) {
  const ai = validateSynthesis(synthesis && synthesis.ikigaiTitle ? toRawSynthesis(synthesis) : synthesis);
  if (!ai) return result;
  const merged = { ...result, ai };
  merged.archetype = ai.archetype;
  merged.statement = ai.statement;
  if (ai.coreThemes.length === 2 && ai.coreThemes[0] !== ai.coreThemes[1]) merged.center = ai.coreThemes;
  merged.sentences = { ...result.sentences };
  for (const c of CIRCLE_ORDER) if (ai.circles[c].sentence) merged.sentences[c] = ai.circles[c].sentence;
  // Careers written by the engine; which circles each one satisfies is checked against the answers.
  const norm = rawAnswers ? scoreAnswers(sanitizeAnswers(rawAnswers)).norm : null;
  merged.careers = ai.careers.map((c, i) => ({
    id: `ai-${i}`,
    ...c,
    circles: norm && c.themes.length ? circleChecks(Object.fromEntries(c.themes.map((th) => [th, 1])), norm) : null,
  }));
  merged.paths = merged.careers.map((c) => c.title);
  if (ai.nextSteps.length) merged.plan = ai.nextSteps;
  return merged;
}

export { CIRCLES };
