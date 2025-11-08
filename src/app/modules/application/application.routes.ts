
import { Router } from 'express';
import { ApplicationController } from './application.controller';
import { authenticate, authorize } from '@/app/middleware/auth';
import { UserRole } from '@/app/types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply for a job (job seekers only)
router.post('/jobs/:jobId/apply', authorize(UserRole.JOB_SEEKER), ApplicationController.applyForJob);

// Get my applications (job seekers only)
router.get('/my', authorize(UserRole.JOB_SEEKER), ApplicationController.getMyApplications);

// Get applications for a specific job (employers, recruiters, admins)
router.get(
  '/jobs/:jobId',
  authorize(UserRole.EMPLOYER, UserRole.RECRUITER, UserRole.ADMIN),
  ApplicationController.getApplicationsByJob
);

// Update application status (employers, recruiters, admins)
router.put(
  '/:id/status',
  authorize(UserRole.EMPLOYER, UserRole.RECRUITER, UserRole.ADMIN),
  ApplicationController.updateApplicationStatus
);

// Delete an application (job seekers only)
router.delete('/:id', authorize(UserRole.JOB_SEEKER), ApplicationController.deleteApplication);

export default router;