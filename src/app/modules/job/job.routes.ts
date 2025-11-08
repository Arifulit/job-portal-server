
import { Router } from 'express';
import { JobController } from './job.controller';
import { authenticate, authorize } from '@/app/middleware/auth';
import { validate } from '@/app/middleware/validate';
import {
  createJobSchema,
  updateJobSchema,
  jobIdSchema,
} from './job.validation';
import { UserRole } from '@/app/types';

const router = Router();

// 🟢 Public Routes
router.get('/', JobController.getAllJobs);
router.get('/:id', validate(jobIdSchema), JobController.getJobById);

// 🔒 Protected Routes (Require Authentication)
router.use(authenticate);

// 🟡 Employer/Admin: Create new Job
router.post(
  '/',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validate(createJobSchema),
  JobController.createJob
);

// 🟡 Employer/Admin: Get own posted Jobs
router.get(
  '/my/jobs',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  JobController.getMyJobs
);

// 🟠 Employer/Admin: Update a Job
router.put(
  '/:id',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validate(updateJobSchema),
  JobController.updateJob
);

// 🔴 Employer/Admin: Delete a Job
router.delete(
  '/:id',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validate(jobIdSchema),
  JobController.deleteJob
);

export default router;
