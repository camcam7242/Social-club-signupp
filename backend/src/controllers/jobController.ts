import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const { rows } = await query(
      `SELECT j.*, q.price, q.notes AS quote_notes,
              sr.service_type, sr.description, sr.location_lat, sr.location_lng,
              v.year, v.make, v.model,
              m.rating AS mechanic_rating, m.business_name
       FROM jobs j
       JOIN quotes q ON q.id = j.quote_id
       JOIN service_requests sr ON sr.id = j.request_id
       JOIN vehicles v ON v.id = sr.vehicle_id
       JOIN mechanics m ON m.id = j.mechanic_id
       WHERE j.id = $1
         AND (j.customer_id = $2 OR j.mechanic_id IN (
           SELECT id FROM mechanics WHERE user_id = $2
         ) OR $3 = 'admin')`,
      [id, userId, role]
    );

    if (!rows.length) throw new AppError('Job not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const getMyJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.user!;

    let rows;
    if (role === 'customer') {
      ({ rows } = await query(
        `SELECT j.*, q.price, sr.service_type, v.year, v.make, v.model
         FROM jobs j
         JOIN quotes q ON q.id = j.quote_id
         JOIN service_requests sr ON sr.id = j.request_id
         JOIN vehicles v ON v.id = sr.vehicle_id
         WHERE j.customer_id = $1
         ORDER BY j.created_at DESC`,
        [userId]
      ));
    } else {
      ({ rows } = await query(
        `SELECT j.*, q.price, sr.service_type, sr.location_lat, sr.location_lng, sr.location_address,
                v.year, v.make, v.model
         FROM jobs j
         JOIN quotes q ON q.id = j.quote_id
         JOIN service_requests sr ON sr.id = j.request_id
         JOIN vehicles v ON v.id = sr.vehicle_id
         JOIN mechanics m ON m.id = j.mechanic_id
         WHERE m.user_id = $1
         ORDER BY j.created_at DESC`,
        [userId]
      ));
    }

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Called when a job completes — records mechanic in customer's history
export const recordMechanicHistory = async (customerId: string, mechanicId: string) => {
  await query(
    `INSERT INTO customer_mechanic_history (customer_id, mechanic_id, job_count, last_job_at)
     VALUES ($1, $2, 1, NOW())
     ON CONFLICT (customer_id, mechanic_id)
     DO UPDATE SET job_count = customer_mechanic_history.job_count + 1, last_job_at = NOW()`,
    [customerId, mechanicId]
  );
};

// GET /api/jobs/my-mechanics — list mechanics the customer has used
export const getMyMechanics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.user!;
    const { rows } = await query(
      `SELECT m.id, m.business_name, m.bio, m.rating, m.review_count, m.tier,
              m.is_available, m.current_lat, m.current_lng, m.service_radius_km,
              u.email,
              cmh.job_count, cmh.last_job_at, cmh.is_favorite
       FROM customer_mechanic_history cmh
       JOIN mechanics m ON m.id = cmh.mechanic_id
       JOIN users u ON u.id = m.user_id
       WHERE cmh.customer_id = $1
       ORDER BY cmh.is_favorite DESC, cmh.last_job_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/jobs/my-mechanics/:mechanicId/favorite — toggle favorite
export const toggleFavoriteMechanic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.user!;
    const { mechanicId } = req.params;

    const existing = await query(
      'SELECT is_favorite FROM customer_mechanic_history WHERE customer_id = $1 AND mechanic_id = $2',
      [userId, mechanicId]
    );
    if (!existing.rows.length) throw new AppError('Mechanic not in your history', 404);

    const newVal = !existing.rows[0].is_favorite;
    await query(
      'UPDATE customer_mechanic_history SET is_favorite = $1 WHERE customer_id = $2 AND mechanic_id = $3',
      [newVal, userId, mechanicId]
    );
    res.json({ is_favorite: newVal });
  } catch (err) {
    next(err);
  }
};
