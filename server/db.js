import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let dbInstance = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: './daily_reports.db',
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      content TEXT,
      createdAt INTEGER
    )
  `);

  return dbInstance;
}
