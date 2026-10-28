import { Router } from 'express';
import { netlabController } from '../controllers/netlab.controller.js';
import { authenticate, requireProjectAccess } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Netlab topology endpoints per project
router.get('/:projectId', requireProjectAccess('viewer'), netlabController.get);
router.put('/:projectId', requireProjectAccess('editor'), netlabController.save);
router.post('/:projectId', requireProjectAccess('editor'), netlabController.save);

export default router;

