import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', requirePermission('view_audit'), auditController.list);

export default router;