import rateLimit from 'express-rate-limit';

// Auth: 10 attempts per 15 min (login, register, forgot password)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
});

// General API: 120 requests per minute per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payments & terminal: 10 per minute — prevent abuse
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many payment requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Service requests: 20 per hour — prevent spam jobs
export const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many service requests created, please wait before submitting more' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat: 60 messages per minute
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Sending messages too fast, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Push notifications: 30 per hour
export const pushLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Too many push notification requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Document uploads: 10 per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many uploads, please wait before uploading more documents' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Reviews: 5 per hour (one per job, prevents spam)
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many reviews submitted, please wait' },
  standardHeaders: true,
  legacyHeaders: false,
});
