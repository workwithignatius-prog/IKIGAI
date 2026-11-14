/**
 * IKIGAI → Google Sheet receiver
 *
 * Collects name, email and Ikigai results from the GitHub Pages version of the site.
 * Setup (about 3 minutes) is in the README under "Google Sheet setup".
 */

const SHEET_NAME = 'Submissions';
const HEADERS = [
  'Journey ID', 'Started at', 'Completed at', 'Status', 'Name', 'Email', 'Email opt-in',
  'Archetype', 'Ikigai', 'Harmony %', 'Passion', 'Mission', 'Profession', 'Vocation',
  'Love (own words)', 'Good at (own words)', 'World needs (own words)', 'Paid for (own words)',
  'Work style', 'Result link', 'Answers (JSON)', 'Site',
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const email = clean(d.email, 254).toLowerCase();
    const id = clean(d.id, 40);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply({ ok: false, error: 'bad id' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply({ ok: false, error: 'bad email' });

    const sheet = getSheet();
    const rowIndex = findRow(sheet, id);
    const existing = rowIndex ? sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0] : null;
    const now = new Date();

    const row = existing || new Array(HEADERS.length).fill('');
    row[0] = id;
    row[1] = existing ? existing[1] : now;
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
      row[19] = clean(d.resultLink, 3000);
      row[20] = clean(JSON.stringify(d.answers || {}), 5000);
    } else if (!existing) {
      row[3] = 'in progress';
    }

    if (rowIndex) sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([row]);
    else sheet.appendRow(row);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the web-app URL in a browser to check it's live.
function doGet() {
  return reply({ ok: true, message: 'IKIGAI sheet receiver is running.' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
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
