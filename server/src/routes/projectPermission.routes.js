import { Router } from 'express';
import { projectPermissionController } from '../controllers/projectPermission.controller.js';
import { authenticate, requireProjectAccess } from '../middlewares/auth.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', requireProjectAccess('viewer'), projectPermissionController.getPermissions);
router.put('/', requireProjectAccess('owner'), projectPermissionController.updatePermissions);

export default router;
