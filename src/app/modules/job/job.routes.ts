import { Router } from 'express';
import { JobController } from './job.controller';
import { authenticate, authorize } from '@/app/middleware/auth';
import { validate } from '@/app/middleware/validate';
import { createJobSchema, updateJobSchema, jobIdSchema } from './job.validation';
import { UserRole } from '@/app/types';

const router = Router();

router.get('/', JobController.getAllJobs);
router.get('/:id', validate(jobIdSchema), JobController.getJobById);

router.use(authenticate);

router.post(
  '/',
  authenticate, // MUST run first
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  JobController.createJob
);

router.get(
  '/my/jobs',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  JobController.getMyJobs
);

router.put(
  '/:id',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validate(updateJobSchema),
  JobController.updateJob
);

router.delete(
  '/:id',
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validate(jobIdSchema),
  JobController.deleteJob
);

export default router;
