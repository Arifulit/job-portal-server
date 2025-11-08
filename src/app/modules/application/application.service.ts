
import mongoose, { Types } from 'mongoose';
import { ApplicationStatus, UserRole } from '@/app/types';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

// Mongoose Models
const JobModel = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({}, { strict: false }), 'jobs');
const ApplicationModel = mongoose.models.Application || mongoose.model('Application', new mongoose.Schema({}, { strict: false }), 'applications');
const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

const nowIso = () => new Date().toISOString();

const toObjectId = (id: string) => {
  try {
    return new Types.ObjectId(id);
  } catch {
    return id;
  }
};

// Apply for a job
const applyForJob = async (jobId: string, applicantId: string, applicationData: any) => {
  try {
    // Find job by _id (ObjectId)
    const job: any = await JobModel.findOne({ _id: toObjectId(jobId) }).lean();
    if (!job) throw new NotFoundError('Job not found');
    
    if ((job.status || '').toLowerCase() !== 'active') {
      throw new ValidationError('This job is not accepting applications');
    }

    // Check if already applied
    const existing = await ApplicationModel.findOne({ 
      job_id: jobId, 
      applicant_id: applicantId 
    }).lean();
    
    if (existing) {
      throw new ConflictError('You have already applied for this job');
    }

    // Create application document
    const doc = {
      job_id: jobId,
      applicant_id: applicantId,
      status: ApplicationStatus.APPLIED,
      resume_url: applicationData?.resume_url || null,
      cover_letter: applicationData?.cover_letter || null,
      applied_at: nowIso(),
      updated_at: nowIso(),
    };

    const app = await new ApplicationModel(doc).save();
    
    // Increment applications count on job
    await JobModel.updateOne(
      { _id: toObjectId(jobId) }, 
      { 
        $inc: { applications_count: 1 }, 
        $set: { updated_at: nowIso() } 
      }
    ).catch(() => null);

    return app.toObject ? app.toObject() : app;
  } catch (err: any) {
    logger.error('ApplicationService.applyForJob error', { error: err?.message || err });
    if (err instanceof NotFoundError || err instanceof ConflictError || err instanceof ValidationError) {
      throw err;
    }
    throw new ValidationError('Failed to submit application');
  }
};

// Get all applications for a specific job (only for employer/recruiter/admin)
const getApplicationsByJob = async (jobId: string, userId: string, userRole: UserRole) => {
  try {
    // Find the job first
    const job: any = await JobModel.findOne({ _id: toObjectId(jobId) }).lean();
    
    logger.info('getApplicationsByJob - Job lookup', { 
      jobId, 
      userId, 
      userRole,
      found: !!job,
      jobEmployerId: job?.employer_id,
      jobEmployerIdAlt: job?.employerId
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Check if user has permission to view applications
    if (userRole === UserRole.ADMIN) {
      logger.info('getApplicationsByJob - Admin access granted');
    } else if (userRole === UserRole.RECRUITER) {
      logger.info('getApplicationsByJob - Recruiter access granted');
    } else {
      // For employers, check if they own the job
      const jobOwnerId = String(job.employer_id || job.employerId || job.employer || '');
      const requestUserId = String(userId);
      
      logger.info('getApplicationsByJob - Owner check', { 
        jobOwnerId, 
        requestUserId,
        match: jobOwnerId === requestUserId 
      });
      
      if (!jobOwnerId) {
        throw new ForbiddenError('Job has no employer assigned');
      }
      
      if (jobOwnerId !== requestUserId) {
        throw new ForbiddenError('You do not have permission to view these applications');
      }
    }

    // Find applications by job_id (stored as string in applications collection)
    const jobIdStr = String(jobId);
    
    // Fetch applications with applicant details using aggregation
    const applications = await ApplicationModel.aggregate([
      { 
        $match: { 
          job_id: jobIdStr
        } 
      },
      { $sort: { applied_at: -1 } },
      {
        $addFields: {
          applicant_id_obj: {
            $cond: {
              if: { $regexMatch: { input: { $toString: '$applicant_id' }, regex: /^[0-9a-fA-F]{24}$/ } },
              then: { $toObjectId: '$applicant_id' },
              else: '$applicant_id'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'applicant_id_obj',
          foreignField: '_id',
          as: 'applicant_docs',
        },
      },
      { $unwind: { path: '$applicant_docs', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          applicant: {
            id: '$applicant_docs._id',
            full_name: '$applicant_docs.full_name',
            email: '$applicant_docs.email',
            phone: '$applicant_docs.phone',
          },
        },
      },
      { $project: { applicant_docs: 0, applicant_id_obj: 0 } },
    ]);

    logger.info('getApplicationsByJob - Applications found', { 
      count: applications.length,
      jobId: jobIdStr
    });

    return applications;
  } catch (err: any) {
    logger.error('ApplicationService.getApplicationsByJob error', { 
      jobId, 
      userId, 
      userRole,
      error: err?.message || err,
      stack: err?.stack 
    });
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      throw err;
    }
    throw new ValidationError('Failed to fetch applications');
  }
};

// Get all applications submitted by a specific user
const getMyApplications = async (applicantId: string) => {
  try {
    // Fetch applications with job and company details using aggregation
    const applications = await ApplicationModel.aggregate([
      { $match: { applicant_id: applicantId } },
      { $sort: { applied_at: -1 } },
      {
        $addFields: {
          job_id_obj: {
            $cond: {
              if: { $regexMatch: { input: { $toString: '$job_id' }, regex: /^[0-9a-fA-F]{24}$/ } },
              then: { $toObjectId: '$job_id' },
              else: '$job_id'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'job_id_obj',
          foreignField: '_id',
          as: 'job_docs',
        },
      },
      { $unwind: { path: '$job_docs', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          employer_id_obj: {
            $cond: {
              if: { 
                $and: [
                  { $ifNull: ['$job_docs.employer_id', false] },
                  { $regexMatch: { input: { $toString: '$job_docs.employer_id' }, regex: /^[0-9a-fA-F]{24}$/ } }
                ]
              },
              then: { $toObjectId: '$job_docs.employer_id' },
              else: '$job_docs.employer_id'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'employer_id_obj',
          foreignField: '_id',
          as: 'employer_docs',
        },
      },
      { $unwind: { path: '$employer_docs', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          job: {
            id: '$job_docs._id',
            title: '$job_docs.title',
            company_name: '$employer_docs.company_name',
            location: '$job_docs.location',
            status: '$job_docs.status',
          },
        },
      },
      { $project: { job_docs: 0, employer_docs: 0, job_id_obj: 0, employer_id_obj: 0 } },
    ]);

    return applications;
  } catch (err: any) {
    logger.error('ApplicationService.getMyApplications error', { error: err?.message || err, stack: err?.stack });
    throw new ValidationError('Failed to fetch your applications');
  }
};

// Update application status (only employer/recruiter/admin)
const updateApplicationStatus = async (
  applicationId: string, 
  newStatus: ApplicationStatus, 
  userId: string, 
  userRole: UserRole
) => {
  try {
    // Find the application
    const app: any = await ApplicationModel.findById(toObjectId(applicationId)).lean();
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    // Check if user has permission to update
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.RECRUITER) {
      // Check if user is the employer who posted the job
      const job: any = await JobModel.findOne({ _id: toObjectId(app.job_id) }).lean();
      if (!job || job.employer_id !== userId) {
        throw new ForbiddenError('You do not have permission to update this application');
      }
    }

    // Update the application
    const updated = await ApplicationModel.findByIdAndUpdate(
      toObjectId(applicationId),
      { 
        status: newStatus, 
        updated_at: nowIso() 
      },
      { new: true }
    );

    return updated?.toObject ? updated.toObject() : updated;
  } catch (err: any) {
    logger.error('ApplicationService.updateApplicationStatus error', { error: err?.message || err });
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      throw err;
    }
    throw new ValidationError('Failed to update application status');
  }
};

// Delete an application (only by applicant)
const deleteApplication = async (applicationId: string, applicantId: string) => {
  try {
    const app: any = await ApplicationModel.findById(toObjectId(applicationId)).lean();
    if (!app) {
      throw new NotFoundError('Application not found');
    }
    
    if (app.applicant_id !== applicantId) {
      throw new ForbiddenError('Not authorized to delete this application');
    }

    await ApplicationModel.deleteOne({ _id: toObjectId(applicationId) });
    
    // Decrement applications count on job
    await JobModel.updateOne(
      { _id: toObjectId(app.job_id) }, 
      { 
        $inc: { applications_count: -1 }, 
        $set: { updated_at: nowIso() } 
      }
    ).catch(() => null);

    return { message: 'Application deleted successfully' };
  } catch (err: any) {
    logger.error('ApplicationService.deleteApplication error', { error: err?.message || err });
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      throw err;
    }
    throw new ValidationError('Failed to delete application');
  }
};

export const ApplicationService = {
  applyForJob,
  getApplicationsByJob,
  getMyApplications,
  updateApplicationStatus,
  deleteApplication,
};