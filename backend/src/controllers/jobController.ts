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
