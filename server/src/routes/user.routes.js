import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission('manage_users'));

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', validate(createUserSchema), userController.create);
router.put('/:id', validate(updateUserSchema), userController.update);
router.delete('/:id', userController.delete);

export default router;
