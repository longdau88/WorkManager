import { Router } from 'express';
import { uploadController, uploadMiddleware } from '../controllers/upload.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', uploadMiddleware.single('file'), uploadController.uploadSingle);
router.delete('/:filename', uploadController.deleteFile);

export default router;
