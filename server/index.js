import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB } from './db.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3007;

// 配置CORS，允许来自前端的请求
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // 允许的源，从环境变量获取或允许所有
  credentials: true, // 允许携带凭证
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'], // 允许的方法
  allowedHeaders: ['Content-Type', 'Authorization'] // 允许的头
}));

// 设置默认CORS源（如果环境变量未设置）
if (!process.env.CORS_ORIGIN) {
  console.log('CORS_ORIGIN environment variable not set, allowing all origins (*)');
}

// 处理OPTIONS预检请求
app.options('*', cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../dist')));

// 密码认证中间件
const passwordAuth = (req, res, next) => {
  const { password } = req.query;
  const validPassword = process.env.HISTORY_PASSWORD;
  
  if (!password || password !== validPassword) {
    return res.status(401).json({ error: '密码错误或未提供' });
  }
  
  next();
};

app.get('/api/reports', passwordAuth, async (req, res) => {
  try {
    const db = await getDB();
    const { templateType } = req.query;
    let query = 'SELECT * FROM reports ORDER BY createdAt DESC';
    let params = [];
    
    if (templateType) {
      query = 'SELECT * FROM reports WHERE templateType = ? ORDER BY createdAt DESC';
      params = [templateType];
    }
    
    const reports = await db.all(query, params);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reports', async (req, res) => {
  const { date, content, templateType = 'qianjiang' } = req.body;
  const createdAt = Date.now();
  try {
    const db = await getDB();
    const result = await db.run(
      'INSERT INTO reports (date, content, templateType, createdAt) VALUES (?, ?, ?, ?)',
      [date, content, templateType, createdAt]
    );
    res.json({ id: result.lastID, date, content, templateType, createdAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/reports/:id', passwordAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDB();
    await db.run('DELETE FROM reports WHERE id = ?', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DeepSeek API 代理路由
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.VITE_DEEPSEEK_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server API Key configuration missing' });
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一个专业的日报整理助手。请将用户提供的工作内容进行语义合并。返回格式必须是 JSON 对象，包含一个字符串数组字段 'items'。" },
          { role: "user", content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    res.json(JSON.parse(data.choices[0].message.content));
  } catch (error) {
    console.error('DeepSeek API Error:', error);
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
