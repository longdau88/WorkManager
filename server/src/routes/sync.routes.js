import { Router } from 'express';
import { syncController } from '../controllers/sync.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { syncBatchSchema } from '../validators/sync.validator.js';

const router = Router();

router.use(authenticate);

router.get('/bootstrap', syncController.getBootstrap);
router.post('/', validate(syncBatchSchema), syncController.syncBatch);

export default router;
