import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { sendPushToUser } from '../services/pushService';

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

    const mechanicId = jobRows[0].mechanic_id;

    // Update mechanic average rating
    await query(
      `UPDATE mechanics SET
        rating = (SELECT AVG(rating) FROM reviews WHERE mechanic_id = $1),
        review_count = (SELECT COUNT(*) FROM reviews WHERE mechanic_id = $1)
       WHERE id = $1`,
      [mechanicId]
    );

    // 5-strike policy: rating <= 2 earns a strike
    if (rating <= 2) {
      const { rows: strikeRows } = await query(
        `UPDATE mechanics
         SET strike_count = strike_count + 1
         WHERE id = $1
         RETURNING strike_count, user_id, suspended_at`,
        [mechanicId]
      );

      const { strike_count, user_id, suspended_at } = strikeRows[0] ?? {};

      if (strike_count === 5 && !suspended_at) {
        // Suspend for 90 days
        await query(
          `UPDATE mechanics
           SET suspended_at = NOW(),
               suspension_ends_at = NOW() + INTERVAL '90 days',
               suspension_reason = '5 low-rated reviews (≤2 stars)',
               is_available = FALSE
           WHERE id = $1`,
          [mechanicId]
        );
        await query(
          `UPDATE users SET is_active = FALSE WHERE id = $1`,
          [user_id]
        );
        await sendPushToUser(user_id, {
          title: '⛔ Account Suspended for 90 Days',
          body: 'You have received 5 low-rated reviews. Your account is suspended for 90 days. You may reapply after your suspension ends.',
          data: { type: 'strike', strike_count, suspended: true },
        });
      } else if (strike_count < 5 && user_id) {
        const remaining = 5 - strike_count;
        const warningMessages: Record<number, string> = {
          1: `You received a low-rated review. Strike 1 of 5 — ${remaining} more and your account will be suspended.`,
          2: `Strike 2 of 5 — ${remaining} more low-rated reviews will suspend your account.`,
          3: `⚠️ Strike 3 of 5 — only ${remaining} more low-rated reviews before suspension. Please improve your service quality.`,
          4: `🚨 Final warning! Strike 4 of 5 — ONE more low-rated review will suspend your account immediately.`,
        };
        await sendPushToUser(user_id, {
          title: `Strike ${strike_count} of 5`,
          body: warningMessages[strike_count] ?? `Strike ${strike_count} of 5 issued.`,
          data: { type: 'strike', strike_count, suspended: false },
        });
      }
    }

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
