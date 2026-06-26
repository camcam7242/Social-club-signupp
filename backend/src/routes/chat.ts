import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getChatMessages, sendChatMessage } from '../controllers/chatController';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get('/', getChatMessages);
router.post('/', sendChatMessage);

export default router;
