import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  // 根据环境选择数据库路径
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/app/data/daily_reports.db' 
    : path.join(__dirname, '../data/daily_reports.db');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      content TEXT,
      templateType TEXT DEFAULT 'qianjiang',
      createdAt INTEGER
    )
  `);

  // 检查是否需要添加 templateType 列（针对旧数据）
  try {
    await dbInstance.exec(`ALTER TABLE reports ADD COLUMN templateType TEXT DEFAULT 'qianjiang'`);
  } catch (e) {
    // 如果列已存在，忽略错误
  }

  return dbInstance;
}
