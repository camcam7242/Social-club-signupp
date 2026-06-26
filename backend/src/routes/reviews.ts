import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { submitReview, getMechanicReviews } from '../controllers/reviewController';

const router = Router();
router.use(authenticate);

router.post('/', requireRole('customer'), submitReview);
router.get('/mechanic/:mechanicId', getMechanicReviews);

export default router;
