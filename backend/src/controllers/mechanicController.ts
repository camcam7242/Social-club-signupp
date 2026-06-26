import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getIO } from '../services/socketService';

export const getMechanicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { rows } = await query(
      `SELECT m.*, u.email, u.phone FROM mechanics m
       JOIN users u ON u.id = m.user_id
       WHERE m.user_id = $1`,
      [userId]
    );
    if (!rows.length) throw new AppError('Mechanic profile not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateMechanicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { business_name, bio, service_radius_km, is_available } = req.body;

    const { rows } = await query(
      `UPDATE mechanics SET
        business_name = COALESCE($1, business_name),
        bio = COALESCE($2, bio),
        service_radius_km = COALESCE($3, service_radius_km),
        is_available = COALESCE($4, is_available),
        updated_at = NOW()
       WHERE user_id = $5 RETURNING *`,
      [business_name, bio, service_radius_km, is_available, userId]
    );
    if (!rows.length) throw new AppError('Mechanic profile not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { lat, lng } = req.body;

    await query(
      'UPDATE mechanics SET current_lat = $1, current_lng = $2 WHERE user_id = $3',
      [lat, lng, userId]
    );

    getIO().emit('mechanic_location_updated', { mechanicUserId: userId, lat, lng });
    res.json({ message: 'Location updated' });
  } catch (err) {
    next(err);
  }
};

export const getNearbyMechanics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = 25 } = req.query;

    // Haversine distance in km
    const { rows } = await query(
      `SELECT m.*, u.email,
        (6371 * acos(
          cos(radians($1)) * cos(radians(m.current_lat)) *
          cos(radians(m.current_lng) - radians($2)) +
          sin(radians($1)) * sin(radians(m.current_lat))
        )) AS distance_km
       FROM mechanics m
       JOIN users u ON u.id = m.user_id
       WHERE m.is_available = TRUE
         AND m.verified = TRUE
         AND m.current_lat IS NOT NULL
       HAVING (6371 * acos(
          cos(radians($1)) * cos(radians(m.current_lat)) *
          cos(radians(m.current_lng) - radians($2)) +
          sin(radians($1)) * sin(radians(m.current_lat))
        )) <= LEAST($3, m.service_radius_km)
       ORDER BY distance_km ASC
       LIMIT 20`,
      [lat, lng, radius]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const submitQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { request_id, price, estimated_duration_hours, notes } = req.body;

    const mechanic = await query('SELECT id FROM mechanics WHERE user_id = $1 AND verified = TRUE', [userId]);
    if (!mechanic.rows.length) throw new AppError('Mechanic not verified', 403);

    const serviceRequest = await query(
      "SELECT id FROM service_requests WHERE id = $1 AND status = 'open'",
      [request_id]
    );
    if (!serviceRequest.rows.length) throw new AppError('Request not available', 404);

    const existing = await query(
      "SELECT id FROM quotes WHERE request_id = $1 AND mechanic_id = $2 AND status = 'pending'",
      [request_id, mechanic.rows[0].id]
    );
    if (existing.rows.length) throw new AppError('Quote already submitted');

    const { rows } = await query(
      `INSERT INTO quotes (request_id, mechanic_id, price, estimated_duration_hours, notes, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '2 hours') RETURNING *`,
      [request_id, mechanic.rows[0].id, price, estimated_duration_hours, notes]
    );

    getIO().to(`request:${request_id}`).emit('new_quote', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const acceptQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quoteId } = req.params;
    const customerId = req.user!.userId;

    const { rows: quoteRows } = await query(
      `SELECT q.*, sr.customer_id FROM quotes q
       JOIN service_requests sr ON sr.id = q.request_id
       WHERE q.id = $1 AND q.status = 'pending'`,
      [quoteId]
    );

    if (!quoteRows.length) throw new AppError('Quote not found', 404);
    const quote = quoteRows[0];
    if (quote.customer_id !== customerId) throw new AppError('Unauthorized', 403);

    // Accept this quote, reject others
    await query("UPDATE quotes SET status = 'accepted' WHERE id = $1", [quoteId]);
    await query(
      "UPDATE quotes SET status = 'rejected' WHERE request_id = $1 AND id != $2",
      [quote.request_id, quoteId]
    );
    await query(
      "UPDATE service_requests SET status = 'accepted', updated_at = NOW() WHERE id = $1",
      [quote.request_id]
    );

    // Create job
    const { rows: jobRows } = await query(
      `INSERT INTO jobs (request_id, quote_id, mechanic_id, customer_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [quote.request_id, quoteId, quote.mechanic_id, customerId]
    );

    getIO().to(`mechanic:${quote.mechanic_id}`).emit('quote_accepted', jobRows[0]);
    res.json(jobRows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateJobStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    const userId = req.user!.userId;

    const mechanic = await query('SELECT id FROM mechanics WHERE user_id = $1', [userId]);
    if (!mechanic.rows.length) throw new AppError('Not a mechanic', 403);

    const validStatuses = ['en_route', 'arrived', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) throw new AppError('Invalid status');

    const updates: Record<string, string> = {
      in_progress: ', started_at = NOW()',
      completed: ', completed_at = NOW()',
    };

    const { rows } = await query(
      `UPDATE jobs SET status = $1 ${updates[status] || ''}, updated_at = NOW()
       WHERE id = $2 AND mechanic_id = $3 RETURNING *`,
      [status, jobId, mechanic.rows[0].id]
    );

    if (!rows.length) throw new AppError('Job not found', 404);

    const eventMap: Record<string, string> = {
      en_route: 'mechanic_en_route',
      arrived: 'mechanic_arrived',
      in_progress: 'job_started',
      completed: 'job_completed',
    };

    getIO().to(`job:${jobId}`).emit(eventMap[status], rows[0]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const getMechanicEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { rows } = await query(
      `SELECT
        COUNT(*) FILTER (WHERE p.status = 'transferred') AS completed_jobs,
        COALESCE(SUM(p.mechanic_payout) FILTER (WHERE p.status = 'transferred'), 0) AS total_earned,
        COALESCE(SUM(p.mechanic_payout) FILTER (
          WHERE p.status = 'transferred' AND p.created_at >= date_trunc('month', NOW())
        ), 0) AS this_month
       FROM payments p
       JOIN mechanics m ON m.id = p.mechanic_id
       WHERE m.user_id = $1`,
      [userId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
