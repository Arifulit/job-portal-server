import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, authorize } from '@/app/middleware/auth';
import { UserRole } from '@/app/types';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/users', AdminController.getAllUsers);
router.put('/users/:userId/status', AdminController.updateUserStatus);
router.delete('/users/:userId', AdminController.deleteUser);

router.get('/dashboard', AdminController.getDashboardStats);
router.get('/jobs', AdminController.getAllJobs);
router.get('/applications', AdminController.getAllApplications);

export default router;
