import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createRequest, getRequests, getRequest, updateRequestStatus } from '../controllers/requestController';

const router = Router();
router.use(authenticate);

router.post('/', createRequest);
router.get('/', getRequests);
router.get('/:id', getRequest);
router.put('/:id/status', updateRequestStatus);

export default router;
