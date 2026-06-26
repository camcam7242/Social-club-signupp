import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const CURRENT_YEAR = new Date().getFullYear();

export const createVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year, make, model, trim, vin, mileage } = req.body;
    const userId = req.user!.userId;

    if (year < 1980 || year > CURRENT_YEAR + 1) {
      throw new AppError(`Year must be between 1980 and ${CURRENT_YEAR + 1}`);
    }

    const { rows } = await query(
      `INSERT INTO vehicles (user_id, year, make, model, trim, vin, mileage)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, year, make, model, trim, vin, mileage]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const getVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      'SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user!.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { year, make, model, trim, vin, mileage } = req.body;

    if (year && (year < 1980 || year > CURRENT_YEAR + 1)) {
      throw new AppError(`Year must be between 1980 and ${CURRENT_YEAR + 1}`);
    }

    const { rows } = await query(
      `UPDATE vehicles SET
        year = COALESCE($1, year),
        make = COALESCE($2, make),
        model = COALESCE($3, model),
        trim = COALESCE($4, trim),
        vin = COALESCE($5, vin),
        mileage = COALESCE($6, mileage),
        updated_at = NOW()
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [year, make, model, trim, vin, mileage, id, req.user!.userId]
    );

    if (!rows.length) throw new AppError('Vehicle not found', 404);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rowCount } = await query(
      'DELETE FROM vehicles WHERE id = $1 AND user_id = $2',
      [id, req.user!.userId]
    );
    if (!rowCount) throw new AppError('Vehicle not found', 404);
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    next(err);
  }
};
