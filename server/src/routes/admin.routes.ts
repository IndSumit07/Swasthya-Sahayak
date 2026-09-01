import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, resolveIdentity } from '../middlewares/auth.middleware';

const router = Router();

// All admin routes require authentication & identity resolution
router.use(authenticate, resolveIdentity);

router.post('/users/provision', adminController.provisionUser);
router.get('/users/staff', adminController.listStaff);
router.get('/districts/summary', adminController.getDistrictSummary);

export default router;
