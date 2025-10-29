import { getDatabase } from '@/app/config/database';
import { ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

export class AdminService {
  static async getAllUsers(filters?: any) {
    const db = getDatabase();
    let query = db
      .from('users')
      .select('id, email, full_name, role, phone, company_name, is_active, is_verified, created_at');

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

    return users;
  }

  static async updateUserStatus(userId: string, isActive: boolean) {
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
  }

  static async deleteUser(userId: string) {
    const db = getDatabase();

    const { error } = await db.from('users').delete().eq('id', userId);

    if (error) {
      logger.error('Failed to delete user:', error);
      throw new ValidationError('Failed to delete user');
    }

    return { message: 'User deleted successfully' };
  }

  static async getDashboardStats() {
    const db = getDatabase();

    const [usersResult, jobsResult, applicationsResult] = await Promise.all([
      db.from('users').select('role', { count: 'exact' }),
      db.from('jobs').select('status', { count: 'exact' }),
      db.from('applications').select('status', { count: 'exact' }),
    ]);

    const usersByRole = usersResult.data?.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const jobsByStatus = jobsResult.data?.reduce((acc: any, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    const applicationsByStatus = applicationsResult.data?.reduce((acc: any, app: any) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    return {
      users: {
        total: usersResult.count || 0,
        byRole: usersByRole || {},
      },
      jobs: {
        total: jobsResult.count || 0,
        byStatus: jobsByStatus || {},
      },
      applications: {
        total: applicationsResult.count || 0,
        byStatus: applicationsByStatus || {},
      },
    };
  }

  static async getAllJobs() {
    const db = getDatabase();

    const { data: jobs, error } = await db
      .from('jobs')
      .select(`
        *,
        employer:users!jobs_employer_id_fkey(id, full_name, email, company_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch jobs:', error);
      throw new ValidationError('Failed to retrieve jobs');
    }

    return jobs;
  }

  static async getAllApplications() {
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

    return applications;
  }
}
