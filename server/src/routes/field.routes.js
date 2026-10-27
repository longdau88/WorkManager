import { Router } from 'express';
import { fieldController } from '../controllers/field.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createFieldSchema, updateFieldSchema } from '../validators/field.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', fieldController.getAll);
router.get('/:id', fieldController.getById);
router.post('/', validate(createFieldSchema), fieldController.create);
router.put('/:id', validate(updateFieldSchema), fieldController.update);
router.delete('/:id', fieldController.delete);

export default router;
