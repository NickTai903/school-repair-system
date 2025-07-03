// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const db = new sqlite3.Database('./repairs.db');

app.use(cors());
app.use(bodyParser.json());

// 建立資料表（只會執行一次）
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS repairs (
    id TEXT PRIMARY KEY,
    name TEXT,
    studentId TEXT,
    grade TEXT,
    class TEXT,
    phone TEXT,
    building TEXT,
    location TEXT,
    itemType TEXT,
    description TEXT,
    photoUrl TEXT,
    status TEXT DEFAULT '已接收',
    urgency TEXT DEFAULT '一般',
    adminNote TEXT DEFAULT '',
    updatedAt TEXT,
    createdAt TEXT
  )`);
});

// 新增報修單 API
app.post('/api/repairs', (req, res) => {
  const {
    name, studentId, grade, class: className, phone,
    building, location, itemType, description, photoUrl
  } = req.body;
  const id = 'R' + new Date().getFullYear() +
    String(new Date().getMonth() + 1).padStart(2, '0') +
    String(new Date().getDate()).padStart(2, '0') +
    '-' + Math.floor(1000 + Math.random() * 9000);
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.run(
    `INSERT INTO repairs (id, name, studentId, grade, class, phone, building, location, itemType, description, photoUrl, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, studentId, grade, className, phone, building, location, itemType, description, photoUrl || '', createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id });
    }
  );
});

// 查詢報修單 API
app.get('/api/repairs/:id', (req, res) => {
  db.get('SELECT * FROM repairs WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// 管理員登入 API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'hlhs' && password === '1234') {
    // 這裡可以回傳一個假的 token，實際應用要用 JWT
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
  }
});
app.put('/api/admin/repairs/:id', (req, res) => {
  const { urgency, status, adminNote } = req.body;
  const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.run(
    `UPDATE repairs SET urgency=?, status=?, adminNote=?, updatedAt=? WHERE id=?`,
    [urgency, status, adminNote, updatedAt, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});
// 取得所有報修單（管理員用）
app.get('/api/admin/repairs', (req, res) => {
  db.all('SELECT * FROM repairs ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});



