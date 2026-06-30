import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getIO } from '../services/socketService';
import { BASIC_ALLOWED, CERTIFIED_ALLOWED } from '../config/jobTiers';

export const createRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicle_id, service_type, description, location_lat, location_lng, location_address } = req.body;
    const customerId = req.user!.userId;

    // Verify vehicle belongs to customer
    const vehicle = await query('SELECT id FROM vehicles WHERE id = $1 AND user_id = $2', [vehicle_id, customerId]);
    if (!vehicle.rows.length) throw new AppError('Vehicle not found', 404);

    const { rows } = await query(
      `INSERT INTO service_requests
         (customer_id, vehicle_id, service_type, description, location_lat, location_lng, location_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [customerId, vehicle_id, service_type, description, location_lat, location_lng, location_address]
    );

    const serviceRequest = rows[0];

    // Notify nearby available mechanics via socket
    getIO().emit('new_service_request', {
      requestId: serviceRequest.id,
      serviceType: serviceRequest.service_type,
      location: { lat: location_lat, lng: location_lng },
    });

    res.status(201).json(serviceRequest);
  } catch (err) {
    next(err);
  }
};

export const getRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.user!;
    let rows;

    if (role === 'customer') {
      ({ rows } = await query(
        `SELECT sr.*, v.year, v.make, v.model FROM service_requests sr
         JOIN vehicles v ON v.id = sr.vehicle_id
         WHERE sr.customer_id = $1 ORDER BY sr.created_at DESC`,
        [userId]
      ));
    } else if (role === 'mechanic') {
      // Filter open requests by what this mechanic's tier allows
      const mechResult = await query('SELECT tier FROM mechanics WHERE user_id = $1', [userId]);
      const tier = mechResult.rows[0]?.tier || 'basic';
      const allowed = tier === 'master' ? null : tier === 'certified' ? CERTIFIED_ALLOWED : BASIC_ALLOWED;
      if (allowed) {
        ({ rows } = await query(
          `SELECT sr.*, v.year, v.make, v.model FROM service_requests sr
           JOIN vehicles v ON v.id = sr.vehicle_id
           WHERE sr.status = 'open' AND sr.service_type = ANY($1) ORDER BY sr.created_at DESC`,
          [allowed]
        ));
      } else {
        ({ rows } = await query(
          `SELECT sr.*, v.year, v.make, v.model FROM service_requests sr
           JOIN vehicles v ON v.id = sr.vehicle_id
           WHERE sr.status = 'open' ORDER BY sr.created_at DESC`
        ));
      }
    } else {
      ({ rows } = await query(
        `SELECT sr.*, v.year, v.make, v.model FROM service_requests sr
         JOIN vehicles v ON v.id = sr.vehicle_id
         ORDER BY sr.created_at DESC`
      ));
    }

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const getRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT sr.*, v.year, v.make, v.model, v.vin,
              json_agg(rm.*) FILTER (WHERE rm.id IS NOT NULL) AS media,
              json_agg(q.*) FILTER (WHERE q.id IS NOT NULL) AS quotes
       FROM service_requests sr
       JOIN vehicles v ON v.id = sr.vehicle_id
       LEFT JOIN request_media rm ON rm.request_id = sr.id
       LEFT JOIN quotes q ON q.request_id = sr.id
       WHERE sr.id = $1
       GROUP BY sr.id, v.year, v.make, v.model, v.vin`,
      [id]
    );
    if (!rows.length) throw new AppError('Request not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateRequestStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { userId, role } = req.user!;

    const allowed: Record<string, string[]> = {
      customer: ['cancelled'],
      admin: ['cancelled', 'open', 'in_progress', 'completed'],
    };

    if (role !== 'admin' && !allowed[role]?.includes(status)) {
      throw new AppError('Cannot set that status', 403);
    }

    const whereClause = role === 'admin' ? 'WHERE id = $2' : 'WHERE id = $2 AND customer_id = $3';
    const params = role === 'admin' ? [status, id] : [status, id, userId];

    const { rows } = await query(
      `UPDATE service_requests SET status = $1, updated_at = NOW() ${whereClause} RETURNING *`,
      params
    );

    if (!rows.length) throw new AppError('Request not found', 404);

    getIO().to(`request:${id}`).emit('request_status_updated', { status });

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
