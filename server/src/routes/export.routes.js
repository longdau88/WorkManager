import { Router } from 'express';
import { authenticate, requirePermission } from '../middlewares/auth.js';
import { exportController } from '../controllers/export.controller.js';
const router = Router();
router.use(authenticate, requirePermission('export_reports'));
router.get('/report.docx', exportController.docx);
router.get('/report.pdf', exportController.pdf);
export default router;