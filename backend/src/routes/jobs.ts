import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getJob, getMyJobs } from '../controllers/jobController';

const router = Router();
router.use(authenticate);

router.get('/', getMyJobs);
router.get('/:id', getJob);

export default router;
