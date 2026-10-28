import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import roleRoutes from './role.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import memberRoutes from './member.routes.js';
import fieldRoutes from './field.routes.js';
import syncRoutes from './sync.routes.js';
import uploadRoutes from './upload.routes.js';
import netlabRoutes from './netlab.routes.js';
import backupRoutes from './backup.routes.js';
import notificationRoutes from './notification.routes.js';
import realtimeRoutes from './realtime.routes.js';
import exportRoutes from './export.routes.js';
import auditRoutes from './audit.routes.js';
import { getDbStatus } from '../config/db.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'WorkManager API is running healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: getDbStatus()
    }
  });
});

// Authentication & Access Control Routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);

// Resource Routers
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/members', memberRoutes);
router.use('/fields', fieldRoutes);
router.use('/sync', syncRoutes);
router.use('/upload', uploadRoutes);
router.use('/netlab', netlabRoutes);
router.use('/backup', backupRoutes);
router.use('/notifications', notificationRoutes);
router.use('/realtime', realtimeRoutes);
router.use('/exports', exportRoutes);
router.use('/audit', auditRoutes);

export default router;
