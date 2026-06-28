import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const signAccess = (userId: string, role: string) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  });

const signRefresh = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
  });

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, phone, role = 'customer' } = req.body;

    if (!['customer', 'mechanic'].includes(role)) throw new AppError('Invalid role');

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) throw new AppError('Email already registered');

    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id, email, role`,
      [email, phone, password_hash, role]
    );
    const user = rows[0];

    if (role === 'mechanic') {
      await query('INSERT INTO mechanics (user_id) VALUES ($1)', [user.id]);
    }

    const accessToken = signAccess(user.id, user.role);
    const refreshToken = signRefresh(user.id);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshToken]
    );

    res.status(201).json({ accessToken, refreshToken, user });
  } catch (err) { next(err); }
};

export const registerProfessional = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, phone, business_name, bio, service_radius_km = 25 } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) throw new AppError('Email already registered');

    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (email, phone, password_hash, role)
       VALUES ($1, $2, $3, 'mechanic') RETURNING id, email, role`,
      [email, phone, password_hash]
    );
    const user = rows[0];

    await query(
      `INSERT INTO mechanics (user_id, business_name, bio, service_radius_km)
       VALUES ($1, $2, $3, $4)`,
      [user.id, business_name, bio, service_radius_km]
    );

    const accessToken = signAccess(user.id, 'mechanic');
    const refreshToken = signRefresh(user.id);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshToken]
    );

    res.status(201).json({ accessToken, refreshToken, user });
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { rows } = await query(
      'SELECT id, email, role, password_hash, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    if (!user) throw new AppError('Invalid credentials', 401);
    if (!user.is_active) throw new AppError('Account suspended', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const accessToken = signAccess(user.id, user.role);
    const refreshToken = signRefresh(user.id);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshToken]
    );

    res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 401);

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    // Also check is_active so suspended users cannot keep minting tokens
    const { rows } = await query(
      `SELECT rt.id, u.role FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW() AND rt.user_id = $2 AND u.is_active = TRUE`,
      [refreshToken, payload.userId]
    );
    if (!rows.length) throw new AppError('Invalid refresh token', 401);

    await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    const newRefresh = signRefresh(payload.userId);
    const accessToken = signAccess(payload.userId, rows[0].role);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [payload.userId, newRefresh]
    );

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) { next(err); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.userId;
    // Only delete the token if it belongs to the authenticated user
    if (refreshToken && userId) {
      await query('DELETE FROM refresh_tokens WHERE token = $1 AND user_id = $2', [refreshToken, userId]);
    }
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      'SELECT id, email, phone, role, email_verified, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    );
    if (!rows.length) throw new AppError('User not found', 404);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);

    // Always return same message to avoid user enumeration
    const RESPONSE = { message: 'If that email exists, a reset link has been sent.' };
    if (!rows.length) return res.json(RESPONSE);

    const plainToken = crypto.randomBytes(32).toString('hex');
    // Store SHA-256 hash so a DB breach can't be used to reset accounts
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [rows[0].id, tokenHash]
    );

    // TODO: replace with real email (SendGrid/SES). Never log tokens in production.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Reset token (plain): ${plainToken}`);
    }
    // Send plainToken to user via email — NOT in the API response
    // await emailService.sendPasswordReset(email, plainToken);

    res.json(RESPONSE);
  } catch (err) { next(err); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) throw new AppError('Token and password required');
    if (password.length < 8) throw new AppError('Password must be at least 8 characters');

    // Hash the incoming token to compare against stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await query(
      `SELECT prt.user_id FROM password_reset_tokens prt
       WHERE prt.token = $1 AND prt.expires_at > NOW() AND prt.used = FALSE`,
      [tokenHash]
    );
    if (!rows.length) throw new AppError('Invalid or expired reset token', 400);

    const password_hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, rows[0].user_id]);
    await query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [tokenHash]);
    // Invalidate all existing sessions
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [rows[0].user_id]);

    res.json({ message: 'Password updated. Please log in again.' });
  } catch (err) { next(err); }
};
