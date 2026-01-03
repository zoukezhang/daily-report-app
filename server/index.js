import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3007;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../dist')));

// 密码认证中间件
const passwordAuth = (req, res, next) => {
  const { password } = req.query;
  const validPassword = '13141500';
  
  if (!password || password !== validPassword) {
    return res.status(401).json({ error: '密码错误或未提供' });
  }
  
  next();
};

app.get('/api/reports', passwordAuth, async (req, res) => {
  try {
    const db = await getDB();
    const reports = await db.all('SELECT * FROM reports ORDER BY createdAt DESC');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reports', async (req, res) => {
  const { date, content } = req.body;
  const createdAt = Date.now();
  try {
    const db = await getDB();
    const result = await db.run(
      'INSERT INTO reports (date, content, createdAt) VALUES (?, ?, ?)',
      [date, content, createdAt]
    );
    res.json({ id: result.lastID, date, content, createdAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDB();
    await db.run('DELETE FROM reports WHERE id = ?', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Anything that doesn't match the above routes, send back index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
