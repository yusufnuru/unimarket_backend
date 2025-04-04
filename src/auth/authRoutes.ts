import { Router } from 'express';
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler,
  verifyEmailHandler,
  sendPasswordResetHandler,
  resetPasswordResetHandler,
  getMe,
} from './authController.js';
import { authenticate } from '../middleware/authenticate.js';

const authRoutes = Router();

authRoutes.post('/register', registerHandler);
authRoutes.post('/login', loginHandler);
authRoutes.get('/refresh', refreshHandler);
authRoutes.get('/logout', logoutHandler);
authRoutes.get('/email/verify/:code', verifyEmailHandler);
authRoutes.post('/password/forgot', sendPasswordResetHandler);
authRoutes.post('/password/reset', resetPasswordResetHandler);
authRoutes.get('/me', authenticate, getMe);
export default authRoutes;
