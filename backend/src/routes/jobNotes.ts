import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getJobNotes, addJobNote } from '../controllers/jobNotesController';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get('/', getJobNotes);
router.post('/', addJobNote);

export default router;
