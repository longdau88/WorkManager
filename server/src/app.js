import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { initDatabase } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: `${env.maxUploadMb + 5}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${env.maxUploadMb + 5}mb` }));

// Auto-initialize database on cold start before processing any API request
let dbInitPromise = null;
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    if (!dbInitPromise) {
      dbInitPromise = initDatabase().catch(err => {
        console.error('Database connection/initialization error:', err);
        return { isPrisma: false, prisma: null };
      });
    }
    try {
      await dbInitPromise;
    } catch (err) {
      console.error('Unhandled dbInit error:', err);
    }
  }
  next();
});

// Serve Uploaded Files
app.use('/uploads', express.static(env.uploadDir));

// Mount REST API
app.use('/api', apiRoutes);

// Serve Frontend Client Files directly
const clientDir = path.resolve(__dirname, '../../client');
app.use(express.static(clientDir));

// Fallback to client/index.html for SPA routing if not an API request
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDir, 'index.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
