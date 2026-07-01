import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getPendingMechanics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      `SELECT m.*, u.email, u.phone, u.created_at AS user_created_at,
              json_agg(md.*) FILTER (WHERE md.id IS NOT NULL) AS documents
       FROM mechanics m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN mechanic_documents md ON md.mechanic_id = m.id
       WHERE m.verified = FALSE
       GROUP BY m.id, u.email, u.phone, u.created_at
       ORDER BY m.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const verifyMechanic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mechanicId } = req.params;
    const { verified } = req.body;

    const { rows } = await query(
      'UPDATE mechanics SET verified = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [verified, mechanicId]
    );
    if (!rows.length) throw new AppError('Mechanic not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const suspendUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    const { rows } = await query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role, is_active',
      [is_active, userId]
    );
    if (!rows.length) throw new AppError('User not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const getAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, requests, payments] = await Promise.all([
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE role = 'customer') AS customers,
        COUNT(*) FILTER (WHERE role = 'mechanic') AS mechanics,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_this_month
        FROM users`),
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'open') AS open,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS this_month
        FROM service_requests`),
      query(`SELECT
        COALESCE(SUM(amount), 0) AS gross_revenue,
        COALESCE(SUM(platform_fee), 0) AS platform_revenue,
        COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('month', NOW())), 0) AS this_month_gross
        FROM payments WHERE status IN ('captured','transferred')`),
    ]);

    res.json({
      users: users.rows[0],
      requests: requests.rows[0],
      payments: payments.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

export const getSuspendedMechanics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      `SELECT m.id, m.strike_count, m.suspended_at, m.suspension_reason,
              u.email, u.id AS user_id, u.is_active
       FROM mechanics m
       JOIN users u ON u.id = m.user_id
       WHERE m.strike_count > 0 OR m.suspended_at IS NOT NULL
       ORDER BY m.strike_count DESC, m.suspended_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const clearMechanicStrikes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mechanicId } = req.params;
    const { rows } = await query(
      `UPDATE mechanics
       SET strike_count = 0, suspended_at = NULL, suspension_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, strike_count, user_id`,
      [mechanicId]
    );
    if (!rows.length) throw new AppError('Mechanic not found', 404);

    // Reinstate the user account
    await query(
      'UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = $1',
      [rows[0].user_id]
    );

    res.json({ message: 'Strikes cleared and account reinstated', mechanic: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const getDisputes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Disputes are payments with 'refunded' or 'failed' status for now
    const { rows } = await query(
      `SELECT p.*, j.status AS job_status, u.email AS customer_email
       FROM payments p
       JOIN jobs j ON j.id = p.job_id
       JOIN users u ON u.id = p.customer_id
       WHERE p.status IN ('refunded','failed')
       ORDER BY p.updated_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
