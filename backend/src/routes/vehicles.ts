import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth';
import { createVehicle, getVehicles, updateVehicle, deleteVehicle } from '../controllers/vehicleController';

const router = Router();
router.use(authenticate);
router.use(requireRole('customer'));

router.post('/', body('year').isInt(), body('make').notEmpty(), body('model').notEmpty(), createVehicle);
router.get('/', getVehicles);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
