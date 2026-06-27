import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Generate a readable promo code like MECH-A3F7-2024
function generateCode(prefix = 'MECH'): string {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${part1}-${part2}`;
}

// Admin: create one or many promo codes
export const createPromoCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      count = 1,
      prefix = 'MECH',
      description = 'Early access — free mechanic beta tester',
      type = 'free_access',
      discount_pct = 0,
      max_uses = 1,
      expires_days = 90,
    } = req.body;

    if (count < 1 || count > 100) throw new AppError('count must be between 1 and 100', 400);
    if (!['free_access', 'discount_pct'].includes(type)) throw new AppError('Invalid type', 400);
    if (discount_pct < 0 || discount_pct > 100) throw new AppError('discount_pct must be 0–100', 400);

    const adminId = req.user!.userId;
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      let code = generateCode(prefix.toUpperCase().slice(0, 8));
      // Retry on collision
      let attempts = 0;
      while (attempts < 5) {
        const existing = await query('SELECT id FROM promo_codes WHERE code = $1', [code]);
        if (!existing.rows.length) break;
        code = generateCode(prefix.toUpperCase().slice(0, 8));
        attempts++;
      }

      await query(
        `INSERT INTO promo_codes (code, description, type, discount_pct, max_uses, expires_at, created_by)
         VALUES ($1, $2, $3, $4, $5, NOW() + ($6 || ' days')::INTERVAL, $7)`,
        [code, description, type, discount_pct, max_uses, String(expires_days), adminId]
      );
      codes.push(code);
    }

    res.status(201).json({ codes, count: codes.length });
  } catch (err) { next(err); }
};

// Admin: list all promo codes
export const listPromoCodes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      `SELECT pc.*, u.email AS created_by_email,
              json_agg(json_build_object('user_id', pr.user_id, 'redeemed_at', pr.redeemed_at))
                FILTER (WHERE pr.id IS NOT NULL) AS redemptions
       FROM promo_codes pc
       LEFT JOIN users u ON u.id = pc.created_by
       LEFT JOIN promo_redemptions pr ON pr.promo_code_id = pc.id
       GROUP BY pc.id, u.email
       ORDER BY pc.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// Admin: delete/deactivate a code
export const deletePromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rowCount } = await query('DELETE FROM promo_codes WHERE id = $1', [id]);
    if (!rowCount) throw new AppError('Promo code not found', 404);
    res.json({ message: 'Promo code deleted' });
  } catch (err) { next(err); }
};

// Public (authenticated): validate a promo code without redeeming it
export const validatePromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!code?.trim()) throw new AppError('code is required', 400);

    const userId = req.user!.userId;
    const upper = code.trim().toUpperCase();

    const { rows } = await query(
      `SELECT pc.*,
              (SELECT COUNT(*) FROM promo_redemptions WHERE promo_code_id = pc.id AND user_id = $2) AS already_used
       FROM promo_codes pc
       WHERE pc.code = $1`,
      [upper, userId]
    );

    if (!rows.length) throw new AppError('Invalid promo code', 404);
    const promo = rows[0];

    if (promo.already_used > 0) throw new AppError('You have already used this code', 400);
    if (promo.used_count >= promo.max_uses) throw new AppError('This promo code has been fully redeemed', 400);
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      throw new AppError('This promo code has expired', 400);
    }

    res.json({
      valid: true,
      type: promo.type,
      discount_pct: promo.discount_pct,
      description: promo.description,
    });
  } catch (err) { next(err); }
};

// Called during mechanic registration to redeem a code
export const redeemPromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!code?.trim()) throw new AppError('code is required', 400);

    const userId = req.user!.userId;
    const upper = code.trim().toUpperCase();

    // Lock the row to prevent race conditions
    const { rows } = await query(
      `SELECT * FROM promo_codes WHERE code = $1 FOR UPDATE`,
      [upper]
    );
    if (!rows.length) throw new AppError('Invalid promo code', 404);
    const promo = rows[0];

    if (promo.used_count >= promo.max_uses) throw new AppError('This promo code has been fully redeemed', 400);
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      throw new AppError('This promo code has expired', 400);
    }

    const existing = await query(
      'SELECT id FROM promo_redemptions WHERE promo_code_id = $1 AND user_id = $2',
      [promo.id, userId]
    );
    if (existing.rows.length) throw new AppError('You have already used this code', 400);

    await query(
      'INSERT INTO promo_redemptions (promo_code_id, user_id) VALUES ($1, $2)',
      [promo.id, userId]
    );
    await query(
      'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1',
      [promo.id]
    );

    // For free_access: mark mechanic as having promo access (skip platform fee or unlock early)
    if (promo.type === 'free_access') {
      await query(
        `UPDATE mechanics SET promo_access = TRUE WHERE user_id = $1`,
        [userId]
      ).catch(() => {}); // Column may not exist yet; migration handles it
    }

    res.json({
      success: true,
      type: promo.type,
      discount_pct: promo.discount_pct,
      description: promo.description,
    });
  } catch (err) { next(err); }
};
