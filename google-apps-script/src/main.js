// ───────────── Google Apps Script backend ─────────────
// Saves submissions to this spreadsheet and runs the Claude-powered cognitive engine.
// The Anthropic API key lives in Project Settings → Script properties → ANTHROPIC_API_KEY.

const SHEET_NAME = 'Submissions';
const HEADERS = [
  'Journey ID', 'Started at', 'Completed at', 'Status', 'Name', 'Email', 'Email opt-in',
  'Archetype', 'Ikigai', 'Harmony %', 'Passion', 'Mission', 'Profession', 'Vocation',
  'Love (own words)', 'Good at (own words)', 'World needs (own words)', 'Paid for (own words)',
  'Work style', 'Result link', 'Answers (JSON)', 'Site',
  'Engine', 'Ikigai title', 'Statement', 'Engine insight', 'Top careers',
];

// Spending guards for the AI engine.
const AI_CALLS_PER_JOURNEY_PER_HOUR = 10;
const AI_CALLS_PER_HOUR = 400;

function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: 'bad json' });
  }
  const id = clean(d.id, 40);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply({ ok: false, error: 'bad id' });

  if (d.type === 'followup' || d.type === 'synthesize') return reply(runEngine(d, id));
  return reply(saveRow(d, id));
}

// Open the web-app URL in a browser to check it's live and whether the engine is on.
function doGet() {
  return reply({ ok: true, ai: Boolean(apiKey()), message: 'IKIGAI backend is running.' });
}

// ───────────── Cognitive engine ─────────────

function apiKey() {
  return PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY') || '';
}

function underLimit(id) {
  const cache = CacheService.getScriptCache();
  const hour = Math.floor(Date.now() / 3600000);
  const keys = ['ai:' + id + ':' + hour, 'ai:all:' + hour];
  const counts = keys.map((k) => Number(cache.get(k) || 0));
  if (counts[0] >= AI_CALLS_PER_JOURNEY_PER_HOUR || counts[1] >= AI_CALLS_PER_HOUR) return false;
  keys.forEach((k, i) => cache.put(k, String(counts[i] + 1), 3700));
  return true;
}

function callClaude(body) {
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey(),
      'anthropic-version': AI_API_VERSION,
      'anthropic-beta': AI_BETAS.join(','),
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code !== 200) throw new Error('Claude API ' + code + ': ' + res.getContentText().slice(0, 300));
  return parseAiMessage(JSON.parse(res.getContentText()));
}

function runEngine(d, id) {
  if (!apiKey()) return { ok: false, error: 'ai_disabled' };
  if (!underLimit(id)) return { ok: false, error: 'rate_limited' };
  const name = clean(d.name, 40);
  try {
    if (d.type === 'followup') {
      const circle = String(d.circle || '');
      const raw = callClaude(buildFollowupRequest(circle, d.answers || {}, name));
      const question = validateQuestionDef(Object.assign({}, raw, { max: 2, source: 'ai' }), circle);
      return question ? { ok: true, question: question } : { ok: false, error: 'invalid' };
    }
    const synthesis = validateSynthesis(callClaude(buildSynthesisRequest(d.answers || {}, name)));
    return synthesis ? { ok: true, synthesis: synthesis } : { ok: false, error: 'invalid' };
  } catch (err) {
    console.error(String(err));
    return { ok: false, error: 'engine_error' };
  }
}

// ───────────── Sheet ─────────────

function saveRow(d, id) {
  const email = clean(d.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'bad email' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getSheet();
    const rowIndex = findRow(sheet, id);
    const existing = rowIndex ? sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0] : null;
    const now = new Date();

    const row = existing || new Array(HEADERS.length).fill('');
    row[0] = id;
    row[1] = existing && existing[1] ? existing[1] : now;
    row[4] = clean(d.name, 80);
    row[5] = email;
    row[6] = d.optIn ? 'yes' : 'no';
    row[21] = clean(d.page, 200);

    if (d.type === 'complete') {
      row[2] = now;
      row[3] = 'complete';
      row[7] = clean(d.archetype, 80);
      row[8] = clean(d.ikigai, 80);
      row[9] = Number(d.harmony) || '';
      row[10] = clean(d.passion, 80);
      row[11] = clean(d.mission, 80);
      row[12] = clean(d.profession, 80);
      row[13] = clean(d.vocation, 80);
      row[14] = clean(d.loveWords, 300);
      row[15] = clean(d.goodWords, 300);
      row[16] = clean(d.needsWords, 300);
      row[17] = clean(d.paidWords, 300);
      row[18] = clean(d.workStyle, 40);
      row[19] = clean(d.resultLink, 6000);
      row[20] = clean(JSON.stringify(d.answers || {}), 20000);
      row[22] = d.engine === 'ai' ? 'ai' : 'rules';
      row[23] = clean(d.ikigaiTitle, 60);
      row[24] = clean(d.statement, 300);
      row[25] = clean(d.insight, 1200);
      row[26] = clean(d.careers, 500);
    } else if (!existing) {
      row[3] = 'in progress';
    }

    if (rowIndex) sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([row]);
    else sheet.appendRow(row);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() < HEADERS.length) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRow(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const hit = sheet.getRange(2, 1, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}

// Trim, limit length and stop spreadsheet formula injection.
function clean(v, max) {
  let s = v == null ? '' : String(v).replace(/\s+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
