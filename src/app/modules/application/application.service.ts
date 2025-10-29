import { getDatabase } from '@/app/config/database';
import { ApplicationStatus, UserRole } from '@/app/types';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

export class ApplicationService {
  static async applyForJob(jobId: string, applicantId: string, applicationData: any) {
    const db = getDatabase();

    const { data: job } = await db.from('jobs').select('id, status').eq('id', jobId).maybeSingle();

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status !== 'active') {
      throw new ValidationError('This job is not accepting applications');
    }

    const { data: existingApplication } = await db
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('applicant_id', applicantId)
      .maybeSingle();

    if (existingApplication) {
      throw new ConflictError('You have already applied for this job');
    }

    const { data: newApplication, error } = await db
      .from('applications')
      .insert({
        job_id: jobId,
        applicant_id: applicantId,
        status: ApplicationStatus.APPLIED,
        resume_url: applicationData.resume_url,
        cover_letter: applicationData.cover_letter,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create application:', error);
      throw new ValidationError('Failed to submit application');
    }

    await db.rpc('increment_job_applications', { job_id: jobId });

    return newApplication;
  }

  static async getApplicationsByJob(jobId: string, employerId: string, userRole: UserRole) {
    const db = getDatabase();

    if (userRole !== UserRole.ADMIN) {
      const { data: job } = await db.from('jobs').select('employer_id').eq('id', jobId).maybeSingle();

      if (!job || job.employer_id !== employerId) {
        throw new ForbiddenError('You do not have permission to view these applications');
      }
    }

    const { data: applications, error } = await db
      .from('applications')
      .select(`
        *,
        applicant:users!applications_applicant_id_fkey(id, full_name, email, phone)
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch applications:', error);
      throw new ValidationError('Failed to retrieve applications');
    }

    return applications;
  }

  static async getMyApplications(applicantId: string) {
    const db = getDatabase();

    const { data: applications, error } = await db
      .from('applications')
      .select(`
        *,
        job:jobs(id, title, company_name:users!jobs_employer_id_fkey(company_name), location, status)
      `)
      .eq('applicant_id', applicantId)
      .order('applied_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch user applications:', error);
      throw new ValidationError('Failed to retrieve applications');
    }

    return applications;
  }

  static async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    userId: string,
    userRole: UserRole
  ) {
    const db = getDatabase();

    const { data: application } = await db
      .from('applications')
      .select('*, job:jobs(employer_id)')
      .eq('id', applicationId)
      .maybeSingle();

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.RECRUITER) {
      const job = application.job as any;
      if (job.employer_id !== userId) {
        throw new ForbiddenError('You do not have permission to update this application');
      }
    }

    const { data: updatedApplication, error } = await db
      .from('applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update application:', error);
      throw new ValidationError('Failed to update application status');
    }

    return updatedApplication;
  }

  static async deleteApplication(applicationId: string, applicantId: string) {
    const db = getDatabase();

    const { data: application } = await db
      .from('applications')
      .select('applicant_id')
      .eq('id', applicationId)
      .maybeSingle();

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.applicant_id !== applicantId) {
      throw new ForbiddenError('You do not have permission to delete this application');
    }

    const { error } = await db.from('applications').delete().eq('id', applicationId);

    if (error) {
      logger.error('Failed to delete application:', error);
      throw new ValidationError('Failed to delete application');
    }

    return { message: 'Application deleted successfully' };
  }
}
