import { Router } from 'express';
import express from 'express';
import { authenticate } from '../middleware/auth';
import { diagnose, checkQuote } from '../controllers/diagnosisController';

const router = Router();
router.use(authenticate);

router.post('/', diagnose);
// Larger body limit for the quote photo (base64 image)
router.post('/quote-check', express.json({ limit: '15mb' }), checkQuote);

export default router;
