// ...existing code...
import { getDatabase } from '@/app/config/database';
import { ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

const getAllUsers = async (filters?: any) => {
  const db = getDatabase() as any;

  // MongoDB client
  if (typeof db?.collection === 'function') {
    try {
      const mongoQ: any = {};
      if (filters?.role) mongoQ.role = filters.role;
      if (filters?.is_active !== undefined) mongoQ.is_active = filters.is_active;

      const users = await db
        .collection('users')
        .find(mongoQ)
        .project({ password_hash: 0, password: 0 })
        .sort({ created_at: -1 })
        .toArray();

      return users || [];
    } catch (err: any) {
      logger.error('Failed to fetch users (mongo):', err);
      throw new ValidationError('Failed to retrieve users');
    }
  }

  // Knex / SQL function client (db is function) or query-builder-like
  if (typeof db === 'function' || typeof db?.select === 'function') {
    try {
      const qb = typeof db === 'function' ? db('users') : db.from('users');
      let query: any = qb.select(
        'id',
        'email',
        'full_name',
        'role',
        'phone',
        'company_name',
        'is_active',
        'is_verified',
        'created_at'
      );

      if (filters?.role) query = query.where('role', filters.role);
      if (filters?.is_active !== undefined) query = query.where('is_active', filters.is_active);

      const rows = await (query.orderBy ? query.orderBy('created_at', 'desc') : query);
      return rows || [];
    } catch (err: any) {
      logger.error('Failed to fetch users (sql):', err);
      throw new ValidationError('Failed to retrieve users');
    }
  }

  // Unknown client
  throw new ValidationError('Unsupported database client for getAllUsers');
};

const updateUserStatus = async (userId: string, isActive: boolean) => {
  const db = getDatabase() as any;

  // MongoDB
  if (typeof db?.collection === 'function') {
    try {
      const res = await db
        .collection('users')
        .findOneAndUpdate({ id: userId }, { $set: { is_active: isActive, updated_at: new Date().toISOString() } }, { returnDocument: 'after' });
      return res.value || null;
    } catch (err: any) {
      logger.error('Failed to update user status (mongo):', err);
      throw new ValidationError('Failed to update user status');
    }
  }

  // Knex / SQL
  if (typeof db === 'function' || typeof db?.update === 'function') {
    try {
      const table = typeof db === 'function' ? db('users') : db.from('users');
      const updated = await table.where({ id: userId }).update({ is_active: isActive, updated_at: new Date().toISOString() }).returning(['id', 'email', 'full_name', 'role', 'is_active']);
      return Array.isArray(updated) ? updated[0] : updated;
    } catch (err: any) {
      logger.error('Failed to update user status (sql):', err);
      throw new ValidationError('Failed to update user status');
    }
  }

  throw new ValidationError('Unsupported database client for updateUserStatus');
};

const deleteUser = async (userId: string) => {
  const db = getDatabase() as any;

  // MongoDB
  if (typeof db?.collection === 'function') {
    try {
      const res = await db.collection('users').deleteOne({ id: userId });
      if (res.deletedCount === 0) throw new Error('Not found');
      return { message: 'User deleted successfully' };
    } catch (err: any) {
      logger.error('Failed to delete user (mongo):', err);
      throw new ValidationError('Failed to delete user');
    }
  }

  // Knex / SQL
  if (typeof db === 'function' || typeof db?.del === 'function') {
    try {
      const table = typeof db === 'function' ? db('users') : db.from('users');
      await table.where({ id: userId }).del();
      return { message: 'User deleted successfully' };
    } catch (err: any) {
      logger.error('Failed to delete user (sql):', err);
      throw new ValidationError('Failed to delete user');
    }
  }

  throw new ValidationError('Unsupported database client for deleteUser');
};

const getDashboardStats = async () => {
  const db = getDatabase() as any;

  const tally = (arr: any[], key: string) =>
    (arr || []).reduce((acc: any, item: any) => {
      const k = item?.[key] ?? 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

  // MongoDB
  if (typeof db?.collection === 'function') {
    try {
      const [users, jobs, applications] = await Promise.all([
        db.collection('users').find({}).project({ role: 1 }).toArray(),
        db.collection('jobs').find({}).project({ status: 1 }).toArray(),
        db.collection('applications').find({}).project({ status: 1 }).toArray(),
      ]);

      return {
        users: { total: users?.length || 0, byRole: tally(users, 'role') },
        jobs: { total: jobs?.length || 0, byStatus: tally(jobs, 'status') },
        applications: { total: applications?.length || 0, byStatus: tally(applications, 'status') },
      };
    } catch (err: any) {
      logger.error('Failed to fetch dashboard stats (mongo):', err);
      throw new ValidationError('Failed to retrieve dashboard stats');
    }
  }

  // Knex / SQL
  if (typeof db === 'function' || typeof db?.select === 'function') {
    try {
      const [usersRows, jobsRows, appsRows] = await Promise.all([
        (typeof db === 'function' ? db('users') : db.from('users')).select('role'),
        (typeof db === 'function' ? db('jobs') : db.from('jobs')).select('status'),
        (typeof db === 'function' ? db('applications') : db.from('applications')).select('status'),
      ]);

      return {
        users: { total: (usersRows || []).length, byRole: tally(usersRows || [], 'role') },
        jobs: { total: (jobsRows || []).length, byStatus: tally(jobsRows || [], 'status') },
        applications: { total: (appsRows || []).length, byStatus: tally(appsRows || [], 'status') },
      };
    } catch (err: any) {
      logger.error('Failed to fetch dashboard stats (sql):', err);
      throw new ValidationError('Failed to retrieve dashboard stats');
    }
  }

  throw new ValidationError('Unsupported database client for getDashboardStats');
};

const getAllJobs = async () => {
  const db = getDatabase() as any;

  // MongoDB
  if (typeof db?.collection === 'function') {
    try {
      const jobs = await db
        .collection('jobs')
        .aggregate([
          { $sort: { created_at: -1 } },
          {
            $lookup: {
              from: 'users',
              localField: 'employer_id',
              foreignField: 'id',
              as: 'employer',
            },
          },
          { $unwind: { path: '$employer', preserveNullAndEmptyArrays: true } },
          { $project: { 'employer.password_hash': 0, 'employer.password': 0 } },
        ])
        .toArray();

      return jobs || [];
    } catch (err: any) {
      logger.error('Failed to fetch jobs (mongo):', err);
      throw new ValidationError('Failed to retrieve jobs');
    }
  }

  // Knex / SQL
  try {
    const rows = await (typeof db === 'function' ? db('jobs') : db.from('jobs'))
      .leftJoin('users as employer', 'jobs.employer_id', 'employer.id')
      .select(
        'jobs.*',
        'employer.id as employer_id',
        'employer.full_name as employer_full_name',
        'employer.email as employer_email',
        'employer.company_name as employer_company_name'
      )
      .orderBy('jobs.created_at', 'desc');

    const mapped = (rows || []).map((r: any) => {
      const { employer_id, employer_full_name, employer_email, employer_company_name, ...job } = r;
      job.employer = employer_id
        ? {
            id: employer_id,
            full_name: employer_full_name,
            email: employer_email,
            company_name: employer_company_name,
          }
        : null;
      return job;
    });

    return mapped;
  } catch (err: any) {
    logger.error('Failed to fetch jobs (sql):', err);
    throw new ValidationError('Failed to retrieve jobs');
  }
};

const getAllApplications = async () => {
  const db = getDatabase() as any;

  // MongoDB
  if (typeof db?.collection === 'function') {
    try {
      const apps = await db
        .collection('applications')
        .aggregate([
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
              localField: 'applicant_id',
              foreignField: 'id',
              as: 'applicant_docs',
            },
          },
          { $unwind: { path: '$applicant_docs', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              job: { id: '$job_docs.id', title: '$job_docs.title' },
              applicant: { id: '$applicant_docs.id', full_name: '$applicant_docs.full_name', email: '$applicant_docs.email' },
            },
          },
          { $project: { job_docs: 0, applicant_docs: 0 } },
        ])
        .toArray();

      return apps || [];
    } catch (err: any) {
      logger.error('Failed to fetch applications (mongo):', err);
      throw new ValidationError('Failed to retrieve applications');
    }
  }

  // Knex / SQL
  try {
    const rows = await (typeof db === 'function' ? db('applications') : db.from('applications'))
      .leftJoin('jobs', 'applications.job_id', 'jobs.id')
      .leftJoin('users as applicants', 'applications.applicant_id', 'applicants.id')
      .select(
        'applications.*',
        'jobs.id as job_id',
        'jobs.title as job_title',
        'applicants.id as applicant_id',
        'applicants.full_name as applicant_full_name',
        'applicants.email as applicant_email'
      )
      .orderBy('applications.applied_at', 'desc');

    const mapped = (rows || []).map((r: any) => {
      const { job_id, job_title, applicant_id, applicant_full_name, applicant_email, ...app } = r;
      app.job = job_id ? { id: job_id, title: job_title } : null;
      app.applicant = applicant_id ? { id: applicant_id, full_name: applicant_full_name, email: applicant_email } : null;
      return app;
    });

    return mapped;
  } catch (err: any) {
    logger.error('Failed to fetch applications (sql):', err);
    throw new ValidationError('Failed to retrieve applications');
  }
};

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getAllJobs,
  getAllApplications,
};
// ...existing code...