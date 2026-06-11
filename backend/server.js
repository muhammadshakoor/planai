require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'planai_secret_key';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DB_FILE = path.join(__dirname, 'db.json');

// ── Simple JSON "database" ────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_FILE)) return { users: [], workspaces: [], nodes: [] };
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function writeDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }
function nextId(arr) { return arr.length > 0 ? Math.max(...arr.map(x => x.id)) + 1 : 1; }

// ── Auth middleware ───────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const db = readDB();
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: nextId(db.users), email, password: hashed };
  db.users.push(user);
  writeDB(db);
  const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email } });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email } });
});

// ── Workspace routes ──────────────────────────────────────────────────────────
app.get('/api/workspaces', auth, (req, res) => {
  const db = readDB();
  res.json(db.workspaces.filter(w => w.user_id === req.user.id));
});

app.post('/api/workspaces', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const db = readDB();
  const ws = { id: nextId(db.workspaces), user_id: req.user.id, name };
  db.workspaces.push(ws);
  writeDB(db);
  res.json(ws);
});

app.delete('/api/workspaces/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  db.workspaces = db.workspaces.filter(w => !(w.id === id && w.user_id === req.user.id));
  db.nodes = db.nodes.filter(n => n.workspace_id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ── Node routes ───────────────────────────────────────────────────────────────
app.get('/api/workspaces/:workspaceId/nodes', auth, (req, res) => {
  const db = readDB();
  res.json(db.nodes.filter(n => n.workspace_id === parseInt(req.params.workspaceId)));
});

app.post('/api/nodes', auth, (req, res) => {
  const { workspace_id, parent_id, title, content, position } = req.body;
  const db = readDB();
  const node = { id: nextId(db.nodes), workspace_id, parent_id: parent_id || null, title, content: content || '', is_completed: false, position: position || 0 };
  db.nodes.push(node);
  writeDB(db);
  res.json(node);
});

app.put('/api/nodes/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const { title, content, is_completed } = req.body;
  const db = readDB();
  const idx = db.nodes.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Node not found' });
  db.nodes[idx] = { ...db.nodes[idx], title, content, is_completed };
  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/nodes/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  function collectIds(nodeId) {
    const ids = [nodeId];
    db.nodes.filter(n => n.parent_id === nodeId).forEach(c => ids.push(...collectIds(c.id)));
    return ids;
  }
  const toDelete = collectIds(id);
  db.nodes = db.nodes.filter(n => !toDelete.includes(n.id));
  writeDB(db);
  res.json({ success: true });
});

// ── Gemini proxy ──────────────────────────────────────────────────────────────
app.post('/api/ai/generate', auth, async (req, res) => {
  const { prompt } = req.body;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Gemini API key not configured in .env' });
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: 'AI request failed: ' + e.message });
  }
});

// Serve built frontend (run `npm run build` in frontend/ first)
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ PlanAI running on http://localhost:${PORT}`));
