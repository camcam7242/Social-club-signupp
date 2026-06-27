import { Request, Response } from 'express';
import { pool } from '../config/database';

export const registerPushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { token, platform } = req.body;

    if (!token || typeof token !== 'string' || token.length > 200) {
      res.status(400).json({ error: 'Valid token is required' });
      return;
    }

    const VALID_PLATFORMS = ['ios', 'android', 'web'];
    if (platform && !VALID_PLATFORMS.includes(platform)) {
      res.status(400).json({ error: 'platform must be ios, android, or web' });
      return;
    }

    await pool.query(
      `INSERT INTO push_tokens (user_id, token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, token) DO UPDATE SET platform = EXCLUDED.platform`,
      [userId, token, platform || null]
    );

    res.json({ message: 'Push token registered' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to register push token' });
  }
};

export const unregisterPushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'token is required' });
      return;
    }

    await pool.query(
      'DELETE FROM push_tokens WHERE user_id = $1 AND token = $2',
      [userId, token]
    );

    res.json({ message: 'Push token removed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to unregister push token' });
  }
};
