import express from 'express';
import app from './server/src/app.js';

// Local standalone support
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`WorkManager running on http://localhost:${PORT}`);
  });
}

export default app;
