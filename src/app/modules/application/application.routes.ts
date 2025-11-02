import { Router } from 'express';
import { ApplicationController } from './application.controller';
import { authenticate, authorize } from '@/app/middleware/auth';
import { UserRole } from '@/app/types';

const router = Router();

router.use(authenticate);

router.post('/jobs/:jobId/apply', authorize(UserRole.JOB_SEEKER), ApplicationController.applyForJob);

router.get('/my', authorize(UserRole.JOB_SEEKER), ApplicationController.getMyApplications);

router.get(
  '/jobs/:jobId',
  authorize(UserRole.EMPLOYER, UserRole.RECRUITER, UserRole.ADMIN),
  (req, res, next) => ApplicationController.getApplicationsByJob(req as any, res, next)
);

router.put(
  '/:id/status',
  authorize(UserRole.EMPLOYER, UserRole.RECRUITER, UserRole.ADMIN),
  ApplicationController.updateApplicationStatus
);

router.delete('/:id', authorize(UserRole.JOB_SEEKER), ApplicationController.deleteApplication);

export default router;