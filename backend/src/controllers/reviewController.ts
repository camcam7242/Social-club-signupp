import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const submitReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.userId;
    const { job_id, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) throw new AppError('Rating must be 1–5');

    const { rows: jobRows } = await query(
      `SELECT j.mechanic_id FROM jobs j
       WHERE j.id = $1 AND j.customer_id = $2 AND j.status = 'completed'`,
      [job_id, customerId]
    );
    if (!jobRows.length) throw new AppError('Job not found or not completed', 404);

    const existing = await query('SELECT id FROM reviews WHERE job_id = $1', [job_id]);
    if (existing.rows.length) throw new AppError('Review already submitted');

    const { rows } = await query(
      `INSERT INTO reviews (job_id, customer_id, mechanic_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [job_id, customerId, jobRows[0].mechanic_id, rating, comment]
    );

    // Update mechanic average rating
    await query(
      `UPDATE mechanics SET
        rating = (SELECT AVG(rating) FROM reviews WHERE mechanic_id = $1),
        review_count = (SELECT COUNT(*) FROM reviews WHERE mechanic_id = $1)
       WHERE id = $1`,
      [jobRows[0].mechanic_id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const getMechanicReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mechanicId } = req.params;
    const { rows } = await query(
      `SELECT r.*, u.email AS customer_email FROM reviews r
       JOIN users u ON u.id = r.customer_id
       WHERE r.mechanic_id = $1
       ORDER BY r.created_at DESC LIMIT 50`,
      [mechanicId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
