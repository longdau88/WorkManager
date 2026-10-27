import app from './server/src/app.js';
import { initDatabase } from './server/src/config/db.js';

let isDbInitialized = false;

async function ensureDatabase() {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.error('Vercel DB Init Error:', err);
    }
  }
}

// Default export for Vercel Express Framework Preset & Serverless
export default async function handler(req, res) {
  await ensureDatabase();
  return app(req, res);
}

// Local standalone support
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  ensureDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`WorkManager running on http://localhost:${PORT}`);
    });
  });
}
