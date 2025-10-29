import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@/app/middleware/validate';
import { authenticate } from '@/app/middleware/auth';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.get('/profile', authenticate, AuthController.getProfile);

export default router;
