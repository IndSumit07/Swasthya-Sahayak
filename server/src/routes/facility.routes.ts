import { Router } from 'express';
import { facilityController } from '../controllers/facility.controller';
import { authenticate, resolveIdentity } from '../middlewares/auth.middleware';

const router = Router();

// Public / Patient endpoints (No auth strictly required to view public directory)
router.get('/', facilityController.list);
router.get('/nearby', facilityController.nearby);
router.get('/services/catalog', facilityController.getServicesCatalog);
router.get('/:id', facilityController.getById);
router.get('/:id/availability', facilityController.getAvailabilityMatrix);

// Admin-only management endpoints (Super Admin, District Admin, Facility Admin)
router.post('/', authenticate, resolveIdentity, facilityController.create);
router.patch('/:id/beds', authenticate, resolveIdentity, facilityController.updateBeds);

// Medicine stock & availability (FR-07)
router.patch('/:id/medicines', authenticate, resolveIdentity, facilityController.upsertMedicine);
router.patch('/:id/medicines/:medicineId/toggle', authenticate, resolveIdentity, facilityController.toggleMedicine);

// Diagnostic test catalog & availability (FR-07)
router.patch('/:id/diagnostics', authenticate, resolveIdentity, facilityController.upsertDiagnostic);
router.patch('/:id/diagnostics/:diagnosticId/toggle', authenticate, resolveIdentity, facilityController.toggleDiagnostic);

// Doctor availability toggle (FR-07)
router.patch('/:id/doctors/:doctorId/availability', authenticate, resolveIdentity, facilityController.updateDoctorAvailability);

// Appointment consultation slots (FR-07)
router.post('/:id/slots', authenticate, resolveIdentity, facilityController.upsertSlot);
router.patch('/:id/slots/:slotId', authenticate, resolveIdentity, facilityController.toggleSlot);
router.delete('/:id/slots/:slotId', authenticate, resolveIdentity, facilityController.deleteSlot);

// Service Directory management (FR-06)
router.post('/:id/services', authenticate, resolveIdentity, facilityController.addService);
router.delete('/:id/services/:serviceId', authenticate, resolveIdentity, facilityController.removeService);

export default router;
