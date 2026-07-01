import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getJob, getMyJobs, getMyMechanics, toggleFavoriteMechanic } from '../controllers/jobController';

const router = Router();
router.use(authenticate);

router.get('/', getMyJobs);
router.get('/my-mechanics', requireRole('customer'), getMyMechanics);
router.post('/my-mechanics/:mechanicId/favorite', requireRole('customer'), toggleFavoriteMechanic);
router.get('/:id', getJob);

export default router;
