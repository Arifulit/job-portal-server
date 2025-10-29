import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '@/app/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.delete('/account', UserController.deleteAccount);

export default router;
