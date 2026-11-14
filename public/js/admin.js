import { THEMES, QUESTIONS } from './questions.js';
import { esc } from './diagram.js';

const KEY = 'ikigai.admin.token';
const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem(KEY) || '';
let rows = [];

const label = (ids) => (ids || []).map((t) => THEMES[t]?.short ?? t).join(' × ');
const when = (s) => (s ? new Date(`${s.replace(' ', 'T')}Z`).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

async function call(path) {
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw Object.assign(new Error((await res.json().catch(() => ({}))).error || res.statusText), { status: res.status });
  return res;
}

function showLogin(msg = '') {
  $('login').hidden = false;
  $('dash').hidden = true;
  $('admin-actions').hidden = true;
  $('login-error').textContent = msg;
  $('login').token.focus();
}

async function load() {
  try {
    const data = await (await call('/api/admin/journeys')).json();
    rows = data.journeys;
    $('login').hidden = true;
    $('dash').hidden = false;
    $('admin-actions').hidden = false;
    const s = data.stats;
    const optIns = new Set(rows.filter((r) => r.marketing_opt_in).map((r) => r.email)).size;
    $('stats').innerHTML = [
      ['People', s.users],
      ['Journeys started', s.journeys],
      ['Ikigais revealed', s.completed],
      ['Completion', s.journeys ? `${Math.round((s.completed / s.journeys) * 100)}%` : '—'],
      ['Email opt-ins', optIns],
    ].map(([k, v]) => `<div class="stat"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join('');
    draw();
  } catch (e) {
    if (e.status === 401 || e.status === 503) {
      sessionStorage.removeItem(KEY);
      token = '';
      showLogin(e.message);
    } else showLogin('Could not reach the server.');
  }
}

function draw() {
  const q = $('search').value.trim().toLowerCase();
  const st = $('status').value;
  const list = rows.filter((r) => {
    if (st && r.status !== st) return false;
    if (!q) return true;
    return [r.name, r.email, r.result?.archetype, label(r.result?.center)].join(' ').toLowerCase().includes(q);
  });
  $('empty').hidden = list.length > 0;
  $('rows').innerHTML = list.map((r) => {
    const x = r.result;
    const answered = Object.keys(r.answers || {}).length;
    return `<tr>
      <td class="who"><b>${esc(r.name)}</b><small>${esc(r.email)}</small>${r.marketing_opt_in ? '<span class="optin">✓ opted in</span>' : ''}</td>
      <td>${x ? `<span class="arch">${esc(x.archetype)}</span><small>${esc(label(x.center))} · harmony ${esc(x.harmony)}%</small>` : `<small>${answered} / ${QUESTIONS.length} answered</small>`}</td>
      <td>${x ? `<div class="ov">${['passion', 'mission', 'profession', 'vocation'].map((k) => `<span><i>${k}</i>${esc(label(x.overlaps[k]))}</span>`).join('')}</div>` : ''}</td>
      <td><span class="pill ${esc(r.status)}">${r.status === 'complete' ? 'Complete' : 'In progress'}</span></td>
      <td><small>${esc(when(r.created_at))}</small></td>
      <td>${x ? `<a href="/?r=${encodeURIComponent(r.id)}" target="_blank" rel="noopener">View map →</a>` : ''}</td>
    </tr>`;
  }).join('');
}

$('login').addEventListener('submit', (e) => {
  e.preventDefault();
  token = e.target.token.value.trim();
  sessionStorage.setItem(KEY, token);
  load();
});
$('refresh').addEventListener('click', load);
$('logout').addEventListener('click', () => {
  sessionStorage.removeItem(KEY);
  token = '';
  showLogin();
});
$('csv').addEventListener('click', async () => {
  try {
    const blob = await (await call('/api/admin/export.csv')).blob();
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `ikigai-submissions-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch (e) {
    alert(e.message);
  }
});
$('search').addEventListener('input', draw);
$('status').addEventListener('change', draw);

if (token) load();
else showLogin();
