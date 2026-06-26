import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { listDocuments, uploadDocument, deleteDocument } from '../controllers/documentController';

const router = Router();
router.use(authenticate);
router.use(requireRole('mechanic'));

router.get('/', listDocuments);
router.post('/', uploadDocument);
router.delete('/:id', deleteDocument);

export default router;
