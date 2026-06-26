import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getMechanicProfile, updateMechanicProfile, updateLocation,
  getNearbyMechanics, submitQuote, acceptQuote, updateJobStatus,
  getMechanicEarnings, getMechanicEta
} from '../controllers/mechanicController';

const router = Router();
router.use(authenticate);

router.get('/nearby', getNearbyMechanics);
router.get('/profile', requireRole('mechanic'), getMechanicProfile);
router.put('/profile', requireRole('mechanic'), updateMechanicProfile);
router.put('/location', requireRole('mechanic'), updateLocation);
router.get('/earnings', requireRole('mechanic'), getMechanicEarnings);
router.post('/quote', requireRole('mechanic'), submitQuote);
router.post('/quotes/:quoteId/accept', requireRole('customer'), acceptQuote);
router.put('/jobs/:jobId/status', requireRole('mechanic'), updateJobStatus);
router.get('/:id/eta', getMechanicEta);

export default router;
