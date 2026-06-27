import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  createPromoCodes, listPromoCodes, deletePromoCode,
  validatePromoCode, redeemPromoCode,
} from '../controllers/promoController';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Admin routes
router.get('/', authenticate, requireRole('admin'), listPromoCodes);
router.post('/create', authenticate, requireRole('admin'), createPromoCodes);
router.delete('/:id', authenticate, requireRole('admin'), deletePromoCode);

// Mechanic/user routes — rate-limited to prevent brute-force guessing
router.post('/validate', authenticate, authLimiter, validatePromoCode);
router.post('/redeem', authenticate, authLimiter, redeemPromoCode);

export default router;
