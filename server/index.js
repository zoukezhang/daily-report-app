import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { getDB } from './db.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

app.get('/api/reports', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
