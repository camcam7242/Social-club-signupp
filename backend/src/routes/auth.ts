import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import {
  register, registerProfessional, login, refresh,
  logout, getMe, forgotPassword, resetPassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Enforce express-validator results — rejects invalid input before hitting controllers
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ error: 'Validation failed', details: errors.array() });
    return;
  }
  next();
};

router.post('/register', authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').optional().isIn(['customer', 'mechanic']),
  validate,
  register
);

router.post('/register/professional', authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('business_name').trim().notEmpty().isLength({ max: 120 }),
  body('bio').optional().isLength({ max: 1000 }),
  body('service_radius_km').optional().isInt({ min: 1, max: 200 }),
  validate,
  registerProfessional
);

router.post('/login', authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  login
);

router.post('/forgot-password', authLimiter,
  body('email').isEmail().normalizeEmail(),
  validate,
  forgotPassword
);

router.post('/reset-password', authLimiter,
  body('token').trim().notEmpty(),
  body('password').isLength({ min: 8 }),
  validate,
  resetPassword
);

router.post('/refresh', refresh);
// Logout requires auth so users can only delete their own refresh tokens
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
