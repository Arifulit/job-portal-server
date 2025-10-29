import { Router } from 'express';
import authRoutes from '@/app/modules/auth/auth.routes';
import userRoutes from '@/app/modules/user/user.routes';
import jobRoutes from '@/app/modules/job/job.routes';
import applicationRoutes from '@/app/modules/application/application.routes';
import adminRoutes from '@/app/modules/admin/admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/admin', adminRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
