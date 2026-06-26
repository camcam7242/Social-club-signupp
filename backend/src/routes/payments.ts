import { Router } from 'express';
import express from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { createPaymentIntent, stripeWebhook, createMechanicAccount } from '../controllers/paymentController';

const router = Router();

// Stripe webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

router.use(authenticate);
router.post('/intent', requireRole('customer'), createPaymentIntent);
router.post('/mechanic-account', requireRole('mechanic'), createMechanicAccount);

export default router;
