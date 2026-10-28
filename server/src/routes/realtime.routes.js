import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { realtimeController } from '../controllers/realtime.controller.js';
const router = Router();
router.use(authenticate);
router.get('/events', realtimeController.stream);
router.post('/presence', realtimeController.heartbeat);
router.get('/presence', realtimeController.presence);
export default router;