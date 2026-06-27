import { Request, Response } from 'express';
import { pool } from '../config/database';
import { sendPushToUser } from '../services/pushService';

async function getJobAndVerifyAccess(jobId: string, userId: string) {
  const { rows } = await pool.query(
    `SELECT j.id, j.customer_id, m.user_id AS mechanic_user_id
     FROM jobs j
     JOIN mechanics m ON m.id = j.mechanic_id
     WHERE j.id = $1`,
    [jobId]
  );
  if (!rows.length) return null;
  const job = rows[0];
  if (job.customer_id !== userId && job.mechanic_user_id !== userId) return null;
  return job;
}

export const getJobNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.params;

    const job = await getJobAndVerifyAccess(jobId, userId);
    if (!job) {
      res.status(403).json({ error: 'Not authorized to view notes for this job' });
      return;
    }

    const { rows } = await pool.query(
      `SELECT jn.*, u.email AS author_email
       FROM job_notes jn
       JOIN users u ON u.id = jn.author_id
       WHERE jn.job_id = $1
       ORDER BY jn.created_at ASC`,
      [jobId]
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch job notes' });
  }
};

export const addJobNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.params;
    const { note } = req.body;

    if (!note?.trim()) {
      res.status(400).json({ error: 'note is required' });
      return;
    }
    if (note.length > 2000) {
      res.status(400).json({ error: 'note must be 2000 characters or less' });
      return;
    }

    const job = await getJobAndVerifyAccess(jobId, userId);
    if (!job) {
      res.status(403).json({ error: 'Not authorized to add notes to this job' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO job_notes (job_id, author_id, note)
       VALUES ($1, $2, $3) RETURNING *`,
      [jobId, userId, note.trim()]
    );

    const newNote = rows[0];

    // Notify the other party
    const otherUserId =
      userId === job.customer_id ? job.mechanic_user_id : job.customer_id;

    await sendPushToUser(otherUserId, {
      title: 'New job note',
      body: note.trim().slice(0, 100),
      data: { jobId },
    });

    res.status(201).json(newNote);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add job note' });
  }
};
