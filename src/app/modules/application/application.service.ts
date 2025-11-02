import { getDatabase } from '@/app/config/database';
import { ApplicationStatus, UserRole } from '@/app/types';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

type AnyDB = any;

function detectClient(db: AnyDB) {
  if (!db) return 'unknown';
  if (typeof db === 'function' || typeof db.raw === 'function') return 'knex';
  if (typeof db.collection === 'function') return 'mongodb';
  return 'mongoose';
}

const nowIso = () => new Date().toISOString();

const applyForJob = async (jobId: string, applicantId: string, applicationData: any) => {
  const db = getDatabase() as AnyDB;
  const client = detectClient(db);

  try {
    if (client === 'knex') {
      const job = await db('jobs').select('id', 'status').where({ id: jobId }).first();
      if (!job) throw new NotFoundError('Job not found');
      if ((job.status || '').toLowerCase() !== 'active') throw new ValidationError('This job is not accepting applications');

      const existing = await db('applications').select('id').where({ job_id: jobId, applicant_id: applicantId }).first();
      if (existing) throw new ConflictError('You have already applied for this job');

      const doc = {
        job_id: jobId,
        applicant_id: applicantId,
        status: ApplicationStatus.APPLIED,
        resume_url: applicationData?.resume_url || null,
        cover_letter: applicationData?.cover_letter || null,
        applied_at: nowIso(),
        updated_at: nowIso(),
      };

      const inserted = await db('applications').insert(doc).returning('*').catch(async () => {
        const res = await db('applications').insert(doc);
        const insertedId = Array.isArray(res) ? res[0] : res;
        return await db('applications').where({ id: insertedId }).first();
      });

      // increment applications_count on jobs (best-effort)
      await db('jobs').where({ id: jobId }).increment('applications_count', 1).catch(() => null);

      return Array.isArray(inserted) ? inserted[0] : inserted;
    }

    if (client === 'mongodb') {
      const job = (await db.collection('jobs').findOne({ id: jobId })) || (await db.collection('jobs').findOne({ _id: jobId } as any));
      if (!job) throw new NotFoundError('Job not found');
      if ((job.status || '').toLowerCase() !== 'active') throw new ValidationError('This job is not accepting applications');

      const existing = await db.collection('applications').findOne({ job_id: jobId, applicant_id: applicantId });
      if (existing) throw new ConflictError('You have already applied for this job');

      const doc: any = {
        job_id: jobId,
        applicant_id: applicantId,
        status: ApplicationStatus.APPLIED,
        resume_url: applicationData?.resume_url || null,
        cover_letter: applicationData?.cover_letter || null,
        applied_at: nowIso(),
        updated_at: nowIso(),
      };

      const result = await db.collection('applications').insertOne(doc);
      await db.collection('jobs').updateOne({ id: jobId } as any, { $inc: { applications_count: 1 } }).catch(() => null);

      return { ...doc, _id: result.insertedId };
    }

    // mongoose fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mongoose = require('mongoose');
    const JobModel = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({}, { strict: false }), 'jobs');
    const ApplicationModel =
      mongoose.models.Application || mongoose.model('Application', new mongoose.Schema({}, { strict: false }), 'applications');

    let job = await JobModel.findOne({ id: jobId }).lean();
    if (!job) job = await JobModel.findOne({ _id: jobId }).lean();
    if (!job) throw new NotFoundError('Job not found');
    if ((job.status || '').toLowerCase() !== 'active') throw new ValidationError('This job is not accepting applications');

    const existingApp = await ApplicationModel.findOne({ job_id: jobId, applicant_id: applicantId }).lean();
    if (existingApp) throw new ConflictError('You have already applied for this job');

    const appDoc = {
      job_id: jobId,
      applicant_id: applicantId,
      status: ApplicationStatus.APPLIED,
      resume_url: applicationData?.resume_url || null,
      cover_letter: applicationData?.cover_letter || null,
      applied_at: nowIso(),
      updated_at: nowIso(),
    };

    const app = await new ApplicationModel(appDoc).save();
    await JobModel.updateOne({ id: jobId }, { $inc: { applications_count: 1 } }).catch(() => null);
    return app.toObject ? app.toObject() : app;
  } catch (err: any) {
    logger.error('ApplicationService.applyForJob error', { client, error: err });
    if (err instanceof NotFoundError || err instanceof ConflictError || err instanceof ValidationError) throw err;
    throw new ValidationError('Failed to submit application');
  }
};

const getApplicationsByJob = async (jobId: string, employerId: string, userRole: UserRole) => {
  const db = getDatabase() as AnyDB;
  const client = detectClient(db);

  try {
    if (client === 'knex') {
      if (userRole !== UserRole.ADMIN) {
        const job = await db('jobs').select('employer_id').where({ id: jobId }).first();
        if (!job || job.employer_id !== employerId) throw new ForbiddenError('You do not have permission to view these applications');
      }

      const rows = await db('applications')
        .leftJoin('users', 'applications.applicant_id', 'users.id')
        .select(
          'applications.*',
          db.raw("json_build_object('id', users.id, 'full_name', users.full_name, 'email', users.email, 'phone', users.phone) as applicant")
        )
        .where('applications.job_id', jobId)
        .orderBy('applications.applied_at', 'desc');

      return rows.map((r: any) => {
        try {
          if (typeof r.applicant === 'string') r.applicant = JSON.parse(r.applicant);
        } catch {}
        return r;
      });
    }

    if (client === 'mongodb') {
      if (userRole !== UserRole.ADMIN) {
        const job = (await db.collection('jobs').findOne({ id: jobId })) || (await db.collection('jobs').findOne({ _id: jobId } as any));
        if (!job || job.employer_id !== employerId) throw new ForbiddenError('You do not have permission to view these applications');
      }

      const apps = await db
        .collection('applications')
        .aggregate([
          { $match: { job_id: jobId } },
          { $sort: { applied_at: -1 } },
          {
            $lookup: {
              from: 'users',
              localField: 'applicant_id',
              foreignField: 'id',
              as: 'applicant_docs',
            },
          },
          { $unwind: { path: '$applicant_docs', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              applicant: {
                id: '$applicant_docs.id',
                full_name: '$applicant_docs.full_name',
                email: '$applicant_docs.email',
                phone: '$applicant_docs.phone',
              },
            },
          },
          { $project: { applicant_docs: 0 } },
        ])
        .toArray();

      return apps;
    }

    // mongoose
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mongoose = require('mongoose');
    const ApplicationModel =
      mongoose.models.Application || mongoose.model('Application', new mongoose.Schema({}, { strict: false }), 'applications');
    const JobModel = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({}, { strict: false }), 'jobs');

    if (userRole !== UserRole.ADMIN) {
      const job = await JobModel.findOne({ id: jobId }).lean();
      if (!job || job.employer_id !== employerId) throw new ForbiddenError('You do not have permission to view these applications');
    }

    const apps = await ApplicationModel.aggregate([
      { $match: { job_id: jobId } },
      { $sort: { applied_at: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'applicant_id',
          foreignField: 'id',
          as: 'applicant_docs',
        },
      },
      { $unwind: { path: '$applicant_docs', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          applicant: {
            id: '$applicant_docs.id',
            full_name: '$applicant_docs.full_name',
            email: '$applicant_docs.email',
            phone: '$applicant_docs.phone',
          },
        },
      },
      { $project: { applicant_docs: 0 } },
    ]).exec();

    return apps;
  } catch (err: any) {
    logger.error('ApplicationService.getApplicationsByJob error', { client, error: err });
    if (err instanceof ForbiddenError) throw err;
    throw new ValidationError('Failed to retrieve applications');
  }
};

const getMyApplications = async (applicantId: string) => {
  const db = getDatabase() as AnyDB;
  const client = detectClient(db);

  try {
    if (client === 'knex') {
      const rows = await db('applications')
        .leftJoin('jobs', 'applications.job_id', 'jobs.id')
        .leftJoin('users as employers', 'jobs.employer_id', 'employers.id')
        .select(
          'applications.*',
          'jobs.id as job_id',
          'jobs.title as job_title',
          'jobs.location as job_location',
          'jobs.status as job_status',
          db.raw("json_build_object('company_name', employers.company_name) as job_company")
        )
        .where('applications.applicant_id', applicantId)
        .orderBy('applications.applied_at', 'desc');

      return rows.map((r: any) => {
        try {
          if (typeof r.job_company === 'string') r.job_company = JSON.parse(r.job_company);
        } catch {}
        return r;
      });
    }

    if (client === 'mongodb') {
      const apps = await db
        .collection('applications')
        .aggregate([
          { $match: { applicant_id: applicantId } },
          { $sort: { applied_at: -1 } },
          {
            $lookup: {
              from: 'jobs',
              localField: 'job_id',
              foreignField: 'id',
              as: 'job_docs',
            },
          },
          { $unwind: { path: '$job_docs', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'users',
              localField: 'job_docs.employer_id',
              foreignField: 'id',
              as: 'employer_docs',
            },
          },
          { $unwind: { path: '$employer_docs', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              job: {
                id: '$job_docs.id',
                title: '$job_docs.title',
                company_name: '$employer_docs.company_name',
                location: '$job_docs.location',
                status: '$job_docs.status',
              },
            },
          },
          { $project: { job_docs: 0, employer_docs: 0 } },
        ])
        .toArray();

      return apps;
    }

    // mongoose
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mongoose = require('mongoose');
    const ApplicationModel =
      mongoose.models.Application || mongoose.model('Application', new mongoose.Schema({}, { strict: false }), 'applications');

    const jobs = await ApplicationModel.aggregate([
      { $match: { applicant_id: applicantId } },
      { $sort: { applied_at: -1 } },
      {
        $lookup: {
          from: 'jobs',
          localField: 'job_id',
          foreignField: 'id',
          as: 'job_docs',
        },
      },
      { $unwind: { path: '$job_docs', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'job_docs.employer_id',
          foreignField: 'id',
          as: 'employer_docs',
        },
      },
      { $unwind: { path: '$employer_docs', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          job: {
            id: '$job_docs.id',
            title: '$job_docs.title',
            company_name: '$employer_docs.company_name',
            location: '$job_docs.location',
            status: '$job_docs.status',
          },
        },
      },
      { $project: { job_docs: 0, employer_docs: 0 } },
    ]).exec();

    return jobs;
  } catch (err: any) {
    logger.error('ApplicationService.getMyApplications error', { client, error: err });
    throw new ValidationError('Failed to retrieve applications');
  }
};

const updateApplicationStatus = async (
  applicationId: string,
  newStatus: ApplicationStatus,
  userId: string,
  userRole: UserRole
) => {
  const db = getDatabase() as AnyDB;
  const client = detectClient(db);

  try {
    if (client === 'knex') {
      const application = await db('applications')
        .select('applications.*', 'jobs.employer_id')
        .leftJoin('jobs', 'applications.job_id', 'jobs.id')
        .where('applications.id', applicationId)
        .first();
      if (!application) throw new NotFoundError('Application not found');

      if (userRole !== UserRole.ADMIN && userRole !== UserRole.RECRUITER) {
        if (application.employer_id !== userId) throw new ForbiddenError('You do not have permission to update this application');
      }

      const updated = await db('applications')
        .where({ id: applicationId })
        .update({ status: newStatus, updated_at: nowIso() })
        .returning('*')
        .catch(async () => {
          await db('applications').where({ id: applicationId }).update({ status: newStatus, updated_at: nowIso() });
          return await db('applications').where({ id: applicationId }).first();
        });

      return Array.isArray(updated) ? updated[0] : updated;
    }

    if (client === 'mongodb') {
      const application = await db
        .collection('applications')
        .aggregate([
          { $match: { id: applicationId } },
          {
            $lookup: {
              from: 'jobs',
              localField: 'job_id',
              foreignField: 'id',
              as: 'job_docs',
            },
          },
          { $unwind: { path: '$job_docs', preserveNullAndEmptyArrays: true } },
        ])
        .toArray()
        .then((a: any[]) => a[0]);

      if (!application) throw new NotFoundError('Application not found');
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.RECRUITER) {
        if (application.job_docs?.employer_id !== userId) throw new ForbiddenError('You do not have permission to update this application');
      }

      await db.collection('applications').updateOne({ id: applicationId } as any, { $set: { status: newStatus, updated_at: nowIso() } });
      return await db.collection('applications').findOne({ id: applicationId } as any);
    }

    // mongoose
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mongoose = require('mongoose');
    const ApplicationModel =
      mongoose.models.Application || mongoose.model('Application', new mongoose.Schema({}, { strict: false }), 'applications');
    const application = (await ApplicationModel.findOne({ id: applicationId }).lean()) || (await ApplicationModel.findOne({ _id: applicationId }).lean());
    if (!application) throw new NotFoundError('Application not found');

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.RECRUITER) {
      const JobModel = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({}, { strict: false }), 'jobs');
      const job = await JobModel.findOne({ id: application.job_id }).lean();
      if (job?.employer_id !== userId) throw new ForbiddenError('You do not have permission to update this application');
    }

    await ApplicationModel.updateOne({ id: applicationId }, { $set: { status: newStatus, updated_at: nowIso() } });
    return await ApplicationModel.findOne({ id: applicationId }).lean();
  } catch (err: any) {
    logger.error('ApplicationService.updateApplicationStatus error', { client, error: err });
    if (err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
    throw new ValidationError('Failed to update application status');
  }
};

const deleteApplication = async (applicationId: string, applicantId: string) => {
  const db = getDatabase() as AnyDB;
  const client = detectClient(db);

  try {
    if (client === 'knex') {
      const app = await db('applications').select('applicant_id').where({ id: applicationId }).first();
      if (!app) throw new NotFoundError('Application not found');
      if (app.applicant_id !== applicantId) throw new ForbiddenError('You do not have permission to delete this application');
      await db('applications').where({ id: applicationId }).del();
      return { message: 'Application deleted successfully' };
    }

    if (client === 'mongodb') {
      const app = (await db.collection('applications').findOne({ id: applicationId })) || (await db.collection('applications').findOne({ _id: applicationId } as any));
      if (!app) throw new NotFoundError('Application not found');
      if (app.applicant_id !== applicantId) throw new ForbiddenError('You do not have permission to delete this application');
      await db.collection('applications').deleteOne({ id: applicationId } as any);
      return { message: 'Application deleted successfully' };
    }

    // mongoose
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mongoose = require('mongoose');
    const ApplicationModel =
      mongoose.models.Application || mongoose.model('Application', new mongoose.Schema({}, { strict: false }), 'applications');
    const app = (await ApplicationModel.findOne({ id: applicationId }).lean()) || (await ApplicationModel.findOne({ _id: applicationId }).lean());
    if (!app) throw new NotFoundError('Application not found');
    if (app.applicant_id !== applicantId) throw new ForbiddenError('You do not have permission to delete this application');
    await ApplicationModel.deleteOne({ id: applicationId });
    return { message: 'Application deleted successfully' };
  } catch (err: any) {
    logger.error('ApplicationService.deleteApplication error', { client, error: err });
    if (err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
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