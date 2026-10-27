import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', taskController.getAll);
router.get('/:id', taskController.getById);
router.post('/', validate(createTaskSchema), taskController.create);
router.put('/:id', validate(updateTaskSchema), taskController.update);
router.delete('/:id', taskController.delete);

export default router;
