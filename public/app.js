const $ = (id) => document.getElementById(id);
let state = { faction: 'Any', players: [] };
let spinning = false;
const COLORS = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d68910', '#16a085', '#7f8c8d', '#c2185b', '#5d6d7e'];

async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Error');
  return data;
}
const assigned = () => state.players.filter((p) => p.role);

function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML.replace(/"/g, '&quot;'); }

function render() {
  $('faction').value = state.faction;
  $('faction').disabled = assigned().length > 0;
  const cur = $('who').value;
  $('who').innerHTML = state.players.filter((p) => !p.role)
    .map((p) => `<option value="${esc(p.id)}">${esc(p.characterName)}</option>`).join('');
  if (cur) $('who').value = cur;
  const left = Rules.remainingRoles(assigned());
  $('needed').textContent = left.length ? 'Still needed: ' + left.join(', ') : 'Party complete! 🎉';
  $('party').querySelector('tbody').innerHTML = state.players.map((p) =>
    `<tr><td>${esc(p.characterName)}</td><td>${esc(p.realName)}</td><td>${esc(p.role)}</td><td>${esc(p.className)}</td><td>${esc(p.race)}</td>` +
    `<td>${p.role ? '' : `<button class="danger" data-del="${esc(p.id)}">✕</button>`}</td></tr>`).join('');
  $('spinBtn').disabled = spinning || !$('who').value || !left.length;
}

function drawWheel(items, angle) {
  const c = $('wheel'), g = c.getContext('2d'), r = c.width / 2, n = items.length, arc = 2 * Math.PI / n;
  g.clearRect(0, 0, c.width, c.height);
  items.forEach((it, i) => {
    g.beginPath(); g.moveTo(r, r);
    g.arc(r, r, r - 10, angle + i * arc, angle + (i + 1) * arc);
    g.fillStyle = COLORS[i % COLORS.length]; g.fill();
    g.save(); g.translate(r, r); g.rotate(angle + (i + 0.5) * arc);
    g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif'; g.textAlign = 'right';
    g.fillText(it, r - 24, 6); g.restore();
  });
  g.beginPath(); g.moveTo(c.width - 2, r); g.lineTo(c.width - 30, r - 12); g.lineTo(c.width - 30, r + 12);
  g.fillStyle = '#ffd100'; g.fill();
}

// pointer is at angle 0 (right side). Resolves with the chosen item after animation.
function spin(items) {
  const n = items.length, arc = 2 * Math.PI / n;
  const pick = Math.floor(Math.random() * n);
  const target = 2 * Math.PI * 6 - (pick + 0.5) * arc;
  const start = performance.now(), dur = 4000;
  return new Promise((resolve) => {
    (function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      drawWheel(items, target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(frame); else resolve(items[pick]);
    })(start);
  });
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function doSpin() {
  const id = $('who').value;
  spinning = true; $('msg').textContent = ''; render();
  try {
    state = await api('GET', '/api/state');
    const done = assigned();
    // one entry per open slot, so DPS (2 slots) is twice as likely as a single-slot role
    $('stage').textContent = 'Spinning for role…';
    const role = await spin(Rules.remainingRoles(done));
    $('stage').textContent = 'Role: ' + role;
    await pause(600);
    const classes = Rules.availableClasses(role, done, state.faction);
    $('stage').textContent = 'Spinning for class…';
    const className = await spin(classes);
    $('stage').textContent = `${role} ${className}`;
    await pause(600);
    $('stage').textContent = 'Spinning for race…';
    const race = await spin(Rules.racesFor(className, state.faction));
    $('stage').textContent = `🎉 ${race} ${className} (${role})!`;
    state = await api('POST', `/api/players/${id}/assign`, { role, className, race });
  } catch (e) {
    $('msg').textContent = e.message;
    try { state = await api('GET', '/api/state'); } catch (e2) { /* ignore */ }
  }
  spinning = false; render();
}

async function run(fn) {
  try { $('msg').textContent = ''; state = await fn(); } catch (e) { $('msg').textContent = e.message; }
  render();
}

$('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await run(() => api('POST', '/api/players', { characterName: $('charName').value, realName: $('realName').value }));
  if (!$('msg').textContent) { $('charName').value = ''; $('realName').value = ''; }
});
$('faction').addEventListener('change', () => run(() => api('POST', '/api/faction', { faction: $('faction').value })));
$('resetBtn').addEventListener('click', () => confirm('Clear everyone\'s spins?') && run(() => api('POST', '/api/reset')));
$('party').addEventListener('click', (e) => { const id = e.target.dataset.del; if (id) run(() => api('DELETE', `/api/players/${id}`)); });
$('spinBtn').addEventListener('click', doSpin);
$('who').addEventListener('change', render);

run(() => api('GET', '/api/state')).then(() => drawWheel(Rules.CLASSES, 0));
setInterval(() => { if (!spinning) run(() => api('GET', '/api/state')); }, 5000);
