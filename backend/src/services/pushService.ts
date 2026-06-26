import axios from 'axios';
import { pool } from '../config/database';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const { rows } = await pool.query(
    'SELECT token FROM push_tokens WHERE user_id = $1',
    [userId]
  );
  if (!rows.length) return;

  const messages = rows.map((r) => ({
    to: r.token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
  }));

  try {
    await axios.post(
      'https://exp.host/--/expo-push-notification/api/v2/push/send',
      messages,
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Push send error', e);
  }
}
