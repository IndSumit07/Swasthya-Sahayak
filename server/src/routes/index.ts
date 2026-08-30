import { Router } from 'express';
import healthRoutes from './health.routes';

const router = Router();

// Mount routes
router.use('/health', healthRoutes);

export default router;
