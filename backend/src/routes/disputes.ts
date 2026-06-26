import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { fileDispute } from '../controllers/disputeController';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.post('/', fileDispute);

export default router;
