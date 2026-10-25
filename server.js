const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Rules = require('./public/rules.js');

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'state.json');
const PUBLIC = path.join(__dirname, 'public');
const MAX_PLAYERS = 4;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function load() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch (e) { return { faction: 'Any', players: [] }; }
}
function save(state) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}
const clean = (s) => String(s || '').trim().slice(0, 40);
const assigned = (state) => state.players.filter((p) => p.role);

function handleApi(req, res, body) {
  const state = load();
  const send = (code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const url = req.url.split('?')[0];
  let m;
  if (req.method === 'GET' && url === '/api/state') return send(200, state);
  if (req.method === 'POST' && url === '/api/players') {
    const characterName = clean(body.characterName), realName = clean(body.realName);
    if (!characterName || !realName) return send(400, { error: 'Enter both names.' });
    if (state.players.length >= MAX_PLAYERS) return send(400, { error: 'Party is full.' });
    state.players.push({ id: crypto.randomUUID(), characterName, realName });
    save(state);
    return send(200, state);
  }
  if (req.method === 'POST' && url === '/api/faction') {
    if (!['Any', 'Alliance', 'Horde'].includes(body.faction)) return send(400, { error: 'Bad faction.' });
    if (assigned(state).length) return send(400, { error: 'Reset before changing faction.' });
    state.faction = body.faction;
    save(state);
    return send(200, state);
  }
  if (req.method === 'POST' && url === '/api/reset') {
    state.players.forEach((p) => { delete p.role; delete p.className; delete p.race; });
    save(state);
    return send(200, state);
  }
  if ((m = url.match(/^\/api\/players\/([\w-]+)$/)) && req.method === 'DELETE') {
    state.players = state.players.filter((p) => p.id !== m[1]);
    save(state);
    return send(200, state);
  }
  if ((m = url.match(/^\/api\/players\/([\w-]+)\/assign$/)) && req.method === 'POST') {
    const player = state.players.find((p) => p.id === m[1]);
    if (!player) return send(404, { error: 'No such player.' });
    if (player.role) return send(400, { error: 'Already rolled.' });
    const err = Rules.validate(assigned(state), body, state.faction);
    if (err) return send(400, { error: err });
    Object.assign(player, { role: body.role, className: body.className, race: body.race });
    save(state);
    return send(200, state);
  }
  send(404, { error: 'Not found.' });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on('end', () => {
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch (e) { /* ignore */ }
      handleApi(req, res, body);
    });
    return;
  }
  const rel = req.url.split('?')[0] === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(PUBLIC, path.normalize(rel));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

if (require.main === module) server.listen(PORT, () => console.log(`Listening on ${PORT}`));
module.exports = server;
