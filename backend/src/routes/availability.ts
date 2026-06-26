import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  listAvailabilityBlocks,
  createAvailabilityBlock,
  deleteAvailabilityBlock,
} from '../controllers/availabilityController';

const router = Router();
router.use(authenticate);
router.use(requireRole('mechanic'));

router.get('/', listAvailabilityBlocks);
router.post('/', createAvailabilityBlock);
router.delete('/:id', deleteAvailabilityBlock);

export default router;
