import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { registerPushToken, unregisterPushToken } from '../controllers/pushController';

const router = Router();
router.use(authenticate);

router.post('/register', registerPushToken);
router.delete('/unregister', unregisterPushToken);

export default router;
