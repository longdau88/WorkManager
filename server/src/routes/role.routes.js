import { Router } from 'express';
import { roleController } from '../controllers/role.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createRoleSchema, updateRoleSchema } from '../validators/role.validator.js';

const router = Router();

router.use(authenticate);

// List available system permissions
router.get('/permissions', roleController.getPermissions);

// Role CRUD requires manage_roles permission
router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.post('/', requirePermission('manage_roles'), validate(createRoleSchema), roleController.create);
router.put('/:id', requirePermission('manage_roles'), validate(updateRoleSchema), roleController.update);
router.delete('/:id', requirePermission('manage_roles'), roleController.delete);

export default router;
