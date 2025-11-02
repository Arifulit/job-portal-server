import { Router } from 'express';
import { JobController } from './job.controller';
import { authenticate, authorize } from '@/app/middleware/auth';
import { validate } from '@/app/middleware/validate';
import { createJobSchema, updateJobSchema, jobIdSchema } from './job.validation';
import { UserRole } from '@/app/types';

const router = Router();

router.get('/', JobController.getAllJobs);
router.get('/:id', validate(jobIdSchema), JobController.getJobById);

// protect remaining routes
router.use(authenticate);

router.post(
  '/',
  validate(createJobSchema),                      // validate body first
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
  validate(jobIdSchema),                          // validate param before auth
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validate(updateJobSchema),                      // then validate body
  JobController.updateJob
);

router.delete(
  '/:id',
  validate(jobIdSchema),                          // validate param before auth
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  JobController.deleteJob
);

export default router;