import { Router } from 'express';
import { memberController } from '../controllers/member.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createMemberSchema, updateMemberSchema } from '../validators/member.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', memberController.getAll);
router.get('/:id', memberController.getById);
router.post('/', validate(createMemberSchema), memberController.create);
router.put('/:id', validate(updateMemberSchema), memberController.update);
router.delete('/:id', memberController.delete);

export default router;
