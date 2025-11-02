import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, authorize } from '@/app/middleware/auth';
import { UserRole } from '@/app/types';

const router = Router();

router.use(authenticate);
// wrap authorize(...) so it's passed as a RequestHandler and not mistaken for a path overload
router.use((req, res, next) => authorize(UserRole.ADMIN)(req, res, next));

router.get('/users', AdminController.getAllUsers);
router.put('/users/:userId/status', AdminController.updateUserStatus);
router.delete('/users/:userId', AdminController.deleteUser);

router.get('/dashboard', AdminController.getDashboardStats);
router.get('/jobs', AdminController.getAllJobs);
router.get('/applications', AdminController.getAllApplications);

export default router;
