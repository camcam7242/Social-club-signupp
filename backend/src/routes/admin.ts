import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getPendingMechanics, verifyMechanic, suspendUser, getAnalytics, getDisputes, getSuspendedMechanics, clearMechanicStrikes } from '../controllers/adminController';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/mechanics/pending', getPendingMechanics);
router.put('/mechanics/:mechanicId/verify', verifyMechanic);
router.put('/users/:userId/suspend', suspendUser);
router.get('/analytics', getAnalytics);
router.get('/disputes', getDisputes);
router.get('/mechanics/strikes', getSuspendedMechanics);
router.put('/mechanics/:mechanicId/clear-strikes', clearMechanicStrikes);

export default router;
