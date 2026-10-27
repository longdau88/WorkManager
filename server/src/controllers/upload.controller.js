import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { env } from '../config/env.js';

// Ensure upload directory exists safely
try {
  if (!fs.existsSync(env.uploadDir)) {
    fs.mkdirSync(env.uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('⚠️ Could not create upload directory:', err.message);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(env.uploadDir)) {
        fs.mkdirSync(env.uploadDir, { recursive: true });
      }
    } catch (e) {}
    cb(null, env.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\u00C0-\u1EF9-]/g, '_');
    const unique = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${base}_${unique}${ext}`);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024
  }
});

export const uploadController = {
  async uploadSingle(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'Vui lòng chọn tệp để tải lên',
          errors: null
        });
      }

      const file = req.file;
      const userEmail = req.headers['x-user-email'] || 'admin@workmanager.local';
      const fileId = path.parse(file.filename).name;
      const fileUrl = `/uploads/${file.filename}`;

      const meta = {
        id: fileId,
        name: file.originalname,
        filename: file.filename,
        mime: file.mimetype,
        size: file.size,
        url: fileUrl,
        by: userEmail,
        at: Date.now()
      };

      res.status(201).json({
        status: 'success',
        message: 'Tải tệp lên thành công',
        data: meta
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteFile(req, res, next) {
    try {
      const { filename } = req.params;
      const filePath = path.join(env.uploadDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        status: 'success',
        message: 'Xoá tệp thành công',
        data: { filename }
      });
    } catch (err) {
      next(err);
    }
  }
};
