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

// Patterns that indicate someone trying to move off-platform
const OFF_PLATFORM_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,          // phone numbers
  /\b\d{10}\b/,                                    // 10-digit phone
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // email addresses
  /\bvenmo\b/i,
  /\bcash\s*app\b/i,
  /\bzelle\b/i,
  /\bpaypal\b/i,
  /\bwhatsapp\b/i,
  /\btelegram\b/i,
  /\bsnapchat\b/i,
  /\binstagram\b/i,
  /\bfacebook\b/i,
  /\btext me\b/i,
  /\bcall me\b/i,
  /\bmy number\b/i,
  /\boff the app\b/i,
  /\boutside the app\b/i,
  /\bdirectly\b/i,
  /\bcash only\b/i,
  /\bpay me cash\b/i,
];

function containsOffPlatformContent(message: string): boolean {
  return OFF_PLATFORM_PATTERNS.some((pattern) => pattern.test(message));
}

export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }
    if (message.length > 2000) {
      res.status(400).json({ error: 'message must be 2000 characters or less' });
      return;
    }

    // Block off-platform contact attempts
    if (containsOffPlatformContent(message)) {
      // Log the violation for admin review
      await pool.query(
        `INSERT INTO chat_violations (job_id, user_id, message, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT DO NOTHING`,
        [jobId, userId, message.trim()]
      ).catch(() => {}); // don't fail if table doesn't exist yet

      // Check how many violations this user has
      const { rows: vRows } = await pool.query(
        `SELECT COUNT(*) AS count FROM chat_violations WHERE user_id = $1`,
        [userId]
      ).catch(() => ({ rows: [{ count: 0 }] }));

      const violationCount = parseInt(vRows[0]?.count || '0');

      if (violationCount >= 3) {
        // Suspend account on 3rd violation
        await pool.query(
          `UPDATE users SET is_active = FALSE WHERE id = $1`,
          [userId]
        );

        // Notify the other party in the chat that this user has been suspended
        const jobAccess = await getJobAndVerifyAccess(jobId, userId);
        if (jobAccess) {
          const otherUserId = userId === jobAccess.customer_id
            ? jobAccess.mechanic_user_id
            : jobAccess.customer_id;
          await sendPushToUser(otherUserId, {
            title: '⚠️ User Suspended',
            body: 'The other person in this chat has been suspended for attempting to take transactions off the platform. Please continue to book through MechMarket.',
            data: { jobId, type: 'suspension_notice' },
          });
        }

        res.status(403).json({
          error: 'Your account has been suspended for attempting to conduct transactions outside the platform.',
          code: 'ACCOUNT_SUSPENDED',
        });
        return;
      }

      res.status(400).json({
        error: 'Your message was blocked. Sharing contact info, payment apps, or arranging off-platform transactions violates our Terms of Service. Further violations may result in account suspension.',
        code: 'OFF_PLATFORM_BLOCKED',
        violations_count: violationCount,
        violations_remaining: 3 - violationCount,
      });
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
