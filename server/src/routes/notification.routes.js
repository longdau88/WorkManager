import { Router } from 'express';
import { authenticate, requirePermission } from '../middlewares/auth.js';
import { notificationController } from '../controllers/notification.controller.js';
const router = Router();
router.use(authenticate);
router.get('/', notificationController.list);
router.post('/read', notificationController.read);
router.post('/run', requirePermission('manage_backups'), notificationController.run);
export default router;