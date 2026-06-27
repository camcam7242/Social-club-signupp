import { Request, Response } from 'express';
import { pool } from '../config/database';

const VALID_DOC_TYPES = ['insurance', 'ase_cert', 'license', 'other'];

async function getMechanicId(userId: string): Promise<string | null> {
  const { rows } = await pool.query(
    'SELECT id FROM mechanics WHERE user_id = $1',
    [userId]
  );
  return rows.length ? rows[0].id : null;
}

export const listDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const mechanicId = await getMechanicId(userId);
    if (!mechanicId) {
      res.status(403).json({ error: 'Mechanic profile not found' });
      return;
    }

    const { rows } = await pool.query(
      'SELECT * FROM mechanic_documents WHERE mechanic_id = $1 ORDER BY uploaded_at DESC',
      [mechanicId]
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list documents' });
  }
};

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { doc_type, file_url, file_name } = req.body;

    if (!doc_type || !file_url) {
      res.status(400).json({ error: 'doc_type and file_url are required' });
      return;
    }

    if (!VALID_DOC_TYPES.includes(doc_type)) {
      res.status(400).json({ error: `doc_type must be one of: ${VALID_DOC_TYPES.join(', ')}` });
      return;
    }

    // Validate file_url to prevent SSRF — must be https and match allowed storage hosts
    try {
      const parsed = new URL(file_url);
      const ALLOWED_HOSTS = (process.env.ALLOWED_STORAGE_HOSTS || 's3.amazonaws.com,storage.googleapis.com').split(',');
      const hostAllowed = ALLOWED_HOSTS.some(h => parsed.hostname.endsWith(h));
      if (parsed.protocol !== 'https:' || !hostAllowed) {
        res.status(400).json({ error: 'file_url must be a valid HTTPS URL from an allowed storage host' });
        return;
      }
    } catch {
      res.status(400).json({ error: 'file_url is not a valid URL' });
      return;
    }

    if (file_name && file_name.length > 255) {
      res.status(400).json({ error: 'file_name too long' });
      return;
    }

    const mechanicId = await getMechanicId(userId);
    if (!mechanicId) {
      res.status(403).json({ error: 'Mechanic profile not found' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO mechanic_documents (mechanic_id, doc_type, file_url, file_name)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [mechanicId, doc_type, file_url, file_name || null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const mechanicId = await getMechanicId(userId);
    if (!mechanicId) {
      res.status(403).json({ error: 'Mechanic profile not found' });
      return;
    }

    const { rowCount } = await pool.query(
      'DELETE FROM mechanic_documents WHERE id = $1 AND mechanic_id = $2',
      [id, mechanicId]
    );

    if (!rowCount) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json({ message: 'Document deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
