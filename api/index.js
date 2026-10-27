import app from '../server/src/app.js';
import { initDatabase } from '../server/src/config/db.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.error('Vercel Serverless DB Init Error:', err);
    }
  }
  return app(req, res);
}
