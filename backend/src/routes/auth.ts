import { Router } from 'express';
import { body } from 'express-validator';
import {
  register, registerProfessional, login, refresh,
  logout, getMe, forgotPassword, resetPassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register', authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  register
);

router.post('/register/professional', authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('business_name').notEmpty(),
  registerProfessional
);

router.post('/login', authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  login
);

router.post('/forgot-password', authLimiter,
  body('email').isEmail().normalizeEmail(),
  forgotPassword
);

router.post('/reset-password',
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
  resetPassword
);

router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
