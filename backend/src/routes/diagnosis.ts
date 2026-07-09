import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { diagnose } from '../controllers/diagnosisController';

const router = Router();
router.use(authenticate);

router.post('/', diagnose);

export default router;
