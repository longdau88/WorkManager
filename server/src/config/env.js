import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  clientUrl: process.env.CLIENT_URL || '*',
  uploadDir: process.env.VERCEL
    ? path.join('/tmp', 'uploads')
    : path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads'),
  maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB || '20', 10),
  jwtSecret: process.env.JWT_SECRET || 'workmanager_super_secret_jwt_key_2026_tlc',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
