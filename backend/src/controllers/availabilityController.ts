import { Request, Response } from 'express';
import { pool } from '../config/database';

async function getMechanicId(userId: string): Promise<string | null> {
  const { rows } = await pool.query(
    'SELECT id FROM mechanics WHERE user_id = $1',
    [userId]
  );
  return rows.length ? rows[0].id : null;
}

export const listAvailabilityBlocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const mechanicId = await getMechanicId(userId);
    if (!mechanicId) {
      res.status(403).json({ error: 'Mechanic profile not found' });
      return;
    }

    const { rows } = await pool.query(
      `SELECT * FROM availability_blocks
       WHERE mechanic_id = $1 AND end_at > NOW()
       ORDER BY start_at ASC`,
      [mechanicId]
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list availability blocks' });
  }
};

export const createAvailabilityBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { start_at, end_at, reason } = req.body;

    if (!start_at || !end_at) {
      res.status(400).json({ error: 'start_at and end_at are required' });
      return;
    }

    if (new Date(start_at) >= new Date(end_at)) {
      res.status(400).json({ error: 'end_at must be after start_at' });
      return;
    }

    const mechanicId = await getMechanicId(userId);
    if (!mechanicId) {
      res.status(403).json({ error: 'Mechanic profile not found' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO availability_blocks (mechanic_id, start_at, end_at, reason)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [mechanicId, start_at, end_at, reason || null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create availability block' });
  }
};

export const deleteAvailabilityBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const mechanicId = await getMechanicId(userId);
    if (!mechanicId) {
      res.status(403).json({ error: 'Mechanic profile not found' });
      return;
    }

    const { rowCount } = await pool.query(
      'DELETE FROM availability_blocks WHERE id = $1 AND mechanic_id = $2',
      [id, mechanicId]
    );

    if (!rowCount) {
      res.status(404).json({ error: 'Availability block not found' });
      return;
    }

    res.json({ message: 'Availability block deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete availability block' });
  }
};
