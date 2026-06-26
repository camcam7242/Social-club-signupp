import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const signAccess = (userId: string, role: string) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const signRefresh = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, phone, role = 'customer' } = req.body;

    if (!['customer', 'mechanic'].includes(role)) {
      throw new AppError('Invalid role');
    }

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
  } catch (err) {
    next(err);
  }
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

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 401);

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };

    const { rows } = await query(
      `SELECT rt.id, u.role FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW() AND rt.user_id = $2`,
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
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      'SELECT id, email, phone, role, email_verified, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    );
    if (!rows.length) throw new AppError('User not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
