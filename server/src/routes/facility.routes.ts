import { Router } from 'express';
import { facilityController } from '../controllers/facility.controller';
import { authenticate, resolveIdentity } from '../middlewares/auth.middleware';

const router = Router();

// Public / Patient endpoints (No auth strictly required to view public directory)
router.get('/', facilityController.list);
router.get('/nearby', facilityController.nearby);
router.get('/:id', facilityController.getById);

// Admin-only management endpoints
router.post('/', authenticate, resolveIdentity, facilityController.create);
router.patch('/:id/beds', authenticate, resolveIdentity, facilityController.updateBeds);
router.patch('/:id/medicines', authenticate, resolveIdentity, facilityController.upsertMedicine);
router.patch('/:id/diagnostics', authenticate, resolveIdentity, facilityController.upsertDiagnostic);

export default router;
