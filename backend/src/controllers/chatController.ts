import { Request, Response } from 'express';
import { pool } from '../config/database';
import { getIO } from '../services/socketService';
import { sendPushToUser } from '../services/pushService';

// Fetch the job and verify the requesting user is the customer or the mechanic's user
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

export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.params;

    const job = await getJobAndVerifyAccess(jobId, userId);
    if (!job) {
      res.status(403).json({ error: 'Not authorized to view this chat' });
      return;
    }

    const { rows } = await pool.query(
      `SELECT cm.*, u.email AS sender_email
       FROM chat_messages cm
       JOIN users u ON u.id = cm.sender_id
       WHERE cm.job_id = $1
       ORDER BY cm.created_at ASC`,
      [jobId]
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
};

export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const job = await getJobAndVerifyAccess(jobId, userId);
    if (!job) {
      res.status(403).json({ error: 'Not authorized to send messages in this chat' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO chat_messages (job_id, sender_id, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [jobId, userId, message.trim()]
    );

    const newMessage = rows[0];

    // Emit to Socket.io room
    getIO().to(`job:${jobId}`).emit('chat_message', newMessage);

    // Push to the other party
    const otherUserId =
      userId === job.customer_id ? job.mechanic_user_id : job.customer_id;

    await sendPushToUser(otherUserId, {
      title: 'New message',
      body: message.trim().slice(0, 100),
      data: { jobId },
    });

    res.status(201).json(newMessage);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
