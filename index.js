import express from 'express';
import app from './server/src/app.js';
import { initDatabase } from './server/src/config/db.js';

let isDbInitialized = false;

// Middleware to ensure database is initialized on serverless request
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.error('Vercel DB Init Error:', err);
    }
  }
  next();
});

// Local standalone support
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`WorkManager running on http://localhost:${PORT}`);
  });
}

export default app;
