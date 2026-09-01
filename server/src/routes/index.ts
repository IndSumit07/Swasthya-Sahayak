import { Router } from 'express';
import healthRoutes           from './health.routes';
import authRoutes             from './auth.routes';
import profileRoutes          from './profile.routes';
import facilityRoutes         from './facility.routes';
import adminRoutes            from './admin.routes';
import appointmentRoutes      from './appointment.routes';
import prescriptionRoutes     from './prescription.routes';
import referralRoutes         from './referral.routes';
import triageRoutes           from './triage.routes';
import mchRoutes              from './mch.routes';
import diagnosticReportRoutes from './diagnosticReport.routes';

const router = Router();

// Mount routes
router.use('/health',              healthRoutes);
router.use('/auth',                authRoutes);
router.use('/profile',             profileRoutes);
router.use('/facilities',          facilityRoutes);
router.use('/admin',               adminRoutes);
router.use('/appointments',        appointmentRoutes);
router.use('/prescriptions',       prescriptionRoutes);
router.use('/referrals',           referralRoutes);
router.use('/triage',              triageRoutes);
router.use('/mch',                 mchRoutes);
router.use('/diagnostics/reports', diagnosticReportRoutes);

export default router;
