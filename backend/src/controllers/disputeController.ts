import { Request, Response } from 'express';
import { pool } from '../config/database';
import { sendPushToUser } from '../services/pushService';

export const fileDispute = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.params;
    const { reason, details } = req.body;

    if (!reason?.trim()) {
      res.status(400).json({ error: 'reason is required' });
      return;
    }
    if (reason.length > 500) {
      res.status(400).json({ error: 'reason must be 500 characters or less' });
      return;
    }
    if (details && details.length > 2000) {
      res.status(400).json({ error: 'details must be 2000 characters or less' });
      return;
    }

    // Verify job exists and user is the customer or the mechanic on this job
    const { rows: jobRows } = await pool.query(
      `SELECT j.id, j.customer_id, m.user_id AS mechanic_user_id
       FROM jobs j
       JOIN mechanics m ON m.id = j.mechanic_id
       WHERE j.id = $1`,
      [jobId]
    );

    if (!jobRows.length) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const job = jobRows[0];
    if (job.customer_id !== userId && job.mechanic_user_id !== userId) {
      res.status(403).json({ error: 'Not authorized to file a dispute for this job' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO disputes (job_id, reporter_id, reason, details)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [jobId, userId, reason.trim(), details || null]
    );

    const dispute = rows[0];

    // Notify all admin users
    const { rows: admins } = await pool.query(
      "SELECT id FROM users WHERE role = 'admin'"
    );

    await Promise.all(
      admins.map((admin) =>
        sendPushToUser(admin.id, {
          title: 'New Dispute Filed',
          body: `Dispute on job ${jobId}: ${reason.trim().slice(0, 80)}`,
          data: { disputeId: dispute.id, jobId },
        })
      )
    );

    res.status(201).json(dispute);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to file dispute' });
  }
};
