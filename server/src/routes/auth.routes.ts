import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, resolveIdentity } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register',        authController.register);
router.post('/login',           authController.login);
router.get('/google',           authController.googleOAuth);
router.get('/callback',         authController.callback);
router.post('/refresh',         authController.refresh);
router.post('/logout',          authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);

// Protected — requires valid session cookie
router.get('/me', authenticate, resolveIdentity, authController.getMe);

export default router;
