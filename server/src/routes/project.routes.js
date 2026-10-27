import { Router } from 'express';
import { projectController } from '../controllers/project.controller.js';
import { authenticate, requirePermission, requireProjectAccess } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';
import projectPermissionRoutes from './projectPermission.routes.js';

const router = Router();

router.use(authenticate);

// Sub-routes for project permissions: /api/projects/:projectId/permissions
router.use('/:projectId/permissions', projectPermissionRoutes);

router.get('/', projectController.getAll);
router.get('/:id', requireProjectAccess('viewer'), projectController.getById);
router.post('/', requirePermission('create_project'), validate(createProjectSchema), projectController.create);
router.put('/:id', requireProjectAccess('editor'), validate(updateProjectSchema), projectController.update);
router.delete('/:id', requireProjectAccess('owner'), projectController.delete);

export default router;
