import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { createConnectionToken, createTerminalPaymentIntent, captureTerminalPayment } from '../controllers/terminalController';
import { paymentLimiter } from '../middleware/rateLimit';

const router = Router();
router.use(authenticate);
router.use(paymentLimiter);

router.post('/connection-token', requireRole('mechanic'), createConnectionToken);
router.post('/payment-intent', requireRole('mechanic'), createTerminalPaymentIntent);
router.post('/capture', requireRole('mechanic'), captureTerminalPayment);

export default router;
