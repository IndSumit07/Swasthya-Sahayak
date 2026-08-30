import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authenticate, resolveIdentity } from '../middlewares/auth.middleware';

const router = Router();

// All profile routes require authentication
router.use(authenticate, resolveIdentity);

router.patch('/patient/step/1', profileController.patientStep1);
router.patch('/patient/step/2', profileController.patientStep2);
router.get('/me',               profileController.getProfile);

export default router;
