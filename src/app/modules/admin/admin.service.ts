import { getDatabase } from '@/app/config/database';
import { ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

// ...existing code...

const getAllUsers = async (filters?: any) => {
  const db = getDatabase() as any;
  let query: any;

  // Handle MongoDB connection (Connection with .collection)
  if (typeof (db as any).collection === 'function') {
    const mongoQ: any = {};
    if (filters?.role) mongoQ.role = filters.role;
    if (filters?.is_active !== undefined) mongoQ.is_active = filters.is_active;

    const users = await (db as any)
      .collection('users')
      .find(mongoQ)
      .project({ password_hash: 0, password: 0 })
      .sort({ created_at: -1 })
      .toArray();

    return users || [];
  }

  // Supabase-style client (has .from)
  if (typeof (db as any).from === 'function') {
    query = (db as any)
      .from('users')
      .select('id, email, full_name, role, phone, company_name, is_active, is_verified, created_at');
  } else {
    // Knex-style client (db is a function) or generic SQL client
    if (typeof db === 'function' || typeof (db as any).select === 'function') {
      // knex instance: db('users').select(...)
      try {
        query = (typeof db === 'function' ? (db as any)('users') : (db as any).from('users')).select(
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
      } catch {
        // fallback to generic from/select shape
        query = (db as any).from ? (db as any).from('users').select('id, email, full_name, role, phone, company_name, is_active, is_verified, created_at') : { order: async () => ({ data: [], error: null }) };
      }
    } else {
      // Unknown client: attempt supabase-style as last resort
      query = (db as any).from ? (db as any).from('users').select('id, email, full_name, role, phone, company_name, is_active, is_verified, created_at') : { order: async () => ({ data: [], error: null }) };
    }
  }

  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  const { data: users, error } = await query.order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch users:', error);
    throw new ValidationError('Failed to retrieve users');
  }

  return users || [];
};

const updateUserStatus = async (userId: string, isActive: boolean) => {
  const db = getDatabase();

  const { data: updatedUser, error } = await db
    .from('users')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, email, full_name, role, is_active')
    .single();

  if (error) {
    logger.error('Failed to update user status:', error);
    throw new ValidationError('Failed to update user status');
  }

  return updatedUser;
};

const deleteUser = async (userId: string) => {
  const db = getDatabase();

  const { error } = await db.from('users').delete().eq('id', userId);

  if (error) {
    logger.error('Failed to delete user:', error);
    throw new ValidationError('Failed to delete user');
  }

  return { message: 'User deleted successfully' };
};

const getDashboardStats = async () => {
  const db = getDatabase() as any;

  // Normalize results to { data: any[], count?: number, error?: any }
  const normalize = (res: any) => {
    if (!res) return { data: [], count: 0, error: null };
    if (Array.isArray(res)) return { data: res, count: res.length, error: null };
    if (res.data) return { data: res.data || [], count: res.count, error: res.error || null };
    return { data: [], count: 0, error: null };
  };

  let usersResult: any;
  let jobsResult: any;
  let applicationsResult: any;

  // MongoDB client
  if (typeof db.collection === 'function') {
    const [users, jobs, applications] = await Promise.all([
      db.collection('users').find({}).project({ role: 1 }).toArray(),
      db.collection('jobs').find({}).project({ status: 1 }).toArray(),
      db.collection('applications').find({}).project({ status: 1 }).toArray(),
    ]);

    usersResult = { data: users || [], count: users?.length || 0, error: null };
    jobsResult = { data: jobs || [], count: jobs?.length || 0, error: null };
    applicationsResult = { data: applications || [], count: applications?.length || 0, error: null };
  }


  const usersByRole = (usersResult.data || []).reduce((acc: any, user: any) => {
    const role = user.role ?? 'unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const jobsByStatus = (jobsResult.data || []).reduce((acc: any, job: any) => {
    const status = job.status ?? 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const applicationsByStatus = (applicationsResult.data || []).reduce((acc: any, app: any) => {
    const status = app.status ?? 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return {
    users: {
      total: usersResult.count ?? (usersResult.data || []).length ?? 0,
      byRole: usersByRole || {},
    },
    jobs: {
      total: jobsResult.count ?? (jobsResult.data || []).length ?? 0,
      byStatus: jobsByStatus || {},
    },
    applications: {
      total: applicationsResult.count ?? (applicationsResult.data || []).length ?? 0,
      byStatus: applicationsByStatus || {},
    },
  };
};

const getAllJobs = async () => {
  const db = getDatabase() as any;

  // MongoDB client
  if (typeof db.collection === 'function') {
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
    }

    return jobs || [];
  }

  // Knex-style or generic SQL client
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
      const {
        employer_id,
        employer_full_name,
        employer_email,
        employer_company_name,
        ...job
      } = r;
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
  } catch (err) {
    logger.error('Failed to fetch jobs:', err);
    throw new ValidationError('Failed to retrieve jobs');
  }
};

const getAllApplications = async () => {
  const db = getDatabase();

  const { data: applications, error } = await db
    .from('applications')
    .select(`
      *,
      job:jobs(id, title),
      applicant:users!applications_applicant_id_fkey(id, full_name, email)
    `)
    .order('applied_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch applications:', error);
    throw new ValidationError('Failed to retrieve applications');
  }

  return applications || [];
};

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  getAllJobs,
  getAllApplications,
};