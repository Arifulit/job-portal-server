import { Types } from "mongoose";
import { User } from "../../../auth/models/User";
import Company from "../../../company/models/Company";
import { Job } from "../../../job/models/Job";

// Get all users from the database
export const impersonateUser = async (adminId: string, targetUserId: string) => {
  try {
    // Verify admin user exists
    const adminUser = await User.findById(adminId);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId).select('-password -refreshToken');
    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Generate an impersonation token
    const payload = {
      _id: targetUser._id,
      email: targetUser.email,
      role: targetUser.role,
      isImpersonated: true,
      originalAdmin: adminId
    };

    // In a real implementation, you would generate a JWT token here
    // For now, we'll return the user details and a flag indicating impersonation
    return {
      success: true,
      message: 'Impersonation successful',
      data: {
        user: targetUser,
        isImpersonated: true,
        originalAdmin: adminId
      }
    };
  } catch (error) {
    console.error('Error in user impersonation:', error);
    throw error;
  }
};

export const suspendUserById = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Toggle the isSuspended status
    user.isSuspended = !user.isSuspended;
    await user.save();
    
    return {
      success: true,
      message: `User ${user.isSuspended ? 'suspended' : 'activated'} successfully`,
      data: {
        userId: user._id,
        isSuspended: user.isSuspended
      }
    };
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

export const getAllUsersFromDB = async () => {
  try {
    const users = await User.find({})
      .select('-password -__v -refreshToken')
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();
    return users;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

export const getAllCandidates = async () => {
  try {
    const candidates = await User.find({ role: 'candidate' })
      .select('-password -__v -refreshToken')
      .sort({ createdAt: -1 })
      .lean();
    return candidates;
  } catch (error) {
    console.error('Error fetching candidates:', error);
    throw error;
  }
};

export const getAllRecruiters = async () => {
  try {
    const recruiters = await User.find({ role: 'recruiter' })
      .select('-password -__v -refreshToken')
      .sort({ createdAt: -1 })
      .lean();
    return recruiters;
  } catch (error) {
    console.error('Error fetching recruiters:', error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, newRole: string) => {
  try {
    // Validate the new role
    const validRoles = ['super_admin', 'admin', 'recruiter', 'candidate'];
    if (!validRoles.includes(newRole.toLowerCase())) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Don't allow changing role if user is suspended
    if (user.isSuspended) {
      throw new Error('Cannot change role of a suspended user');
    }

    // Update the role
    user.role = newRole.toLowerCase() as any;
    await user.save();

    // Return user data without sensitive information
    const { password, refreshToken, ...userWithoutSensitiveData } = user.toObject();
    
    return {
      success: true,
      message: `User role updated to ${newRole} successfully`,
      data: userWithoutSensitiveData
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};



export const getAllUsers = async () => {
  try {
    const allUsers = await getAllUsersFromDB();
    
    // Filter out admin users
    const nonAdminUsers = allUsers.filter(user => user.role !== 'admin');
    
    // Count users by role (excluding admins)
    const roleCounts = nonAdminUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Separate users by role (excluding admins)
    const candidates = nonAdminUsers.filter(user => user.role === 'candidate');
    const recruiters = nonAdminUsers.filter(user => user.role === 'recruiter');

    const result: any = {
      totalUsers: nonAdminUsers.length,
      ...roleCounts,  // This will include candidate: Y, recruiter: Z
      allUsers: nonAdminUsers
    };

    // Only include non-empty arrays in the response
    if (candidates.length > 0) result.candidates = candidates;
    if (recruiters.length > 0) result.recruiters = recruiters;

    return result;
  } catch (error) {
    console.error('Error fetching users data:', error);
    throw error;
  }
};

export const setRecruiterApproval = async (adminId: string, userId: string, approved: boolean) => {
  try {
    const adminUser = await User.findById(adminId).select('role');
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Only admin can verify recruiters');
    }

    const recruiter = await User.findById(userId);
    if (!recruiter) {
      throw new Error('User not found');
    }

    if (recruiter.role !== 'recruiter') {
      throw new Error('Target user is not a recruiter');
    }

    recruiter.isRecruiterApproved = approved;
    recruiter.recruiterApprovedAt = approved ? new Date() : null as any;
    recruiter.recruiterApprovedBy = approved ? (adminUser._id as any) : null as any;
    await recruiter.save();

    return {
      success: true,
      message: approved ? 'Recruiter approved successfully' : 'Recruiter approval revoked successfully',
      data: {
        userId: recruiter._id,
        role: recruiter.role,
        isRecruiterApproved: recruiter.isRecruiterApproved,
        recruiterApprovedAt: recruiter.recruiterApprovedAt,
        recruiterApprovedBy: recruiter.recruiterApprovedBy
      }
    };
  } catch (error) {
    console.error('Error setting recruiter approval:', error);
    throw error;
  }
};

export const getModerationOverview = async () => {
  try {
    const [pendingRecruiters, pendingCompanies, verifiedCompanies, activeJobs, reportedJobs] = await Promise.all([
      User.find({ role: 'recruiter', isRecruiterApproved: { $ne: true } })
        .select('_id name email role isRecruiterApproved createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      Company.find({ isVerified: { $ne: true } })
        .sort({ createdAt: -1 })
        .lean(),
      Company.find({ isVerified: true })
        .sort({ updatedAt: -1 })
        .lean(),
      Job.find({ status: 'approved', isApproved: true })
        .select('_id title company createdBy status isApproved approvedAt createdAt updatedAt')
        .populate('company', 'name')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
      // "Reported jobs" are interpreted as moderation-flagged/rejected jobs in current schema.
      Job.find({ $or: [{ status: 'rejected' }, { rejectionReason: { $nin: ['', null] } }] })
        .select('_id title company createdBy status rejectionReason rejectedAt createdAt updatedAt')
        .populate('company', 'name')
        .populate('createdBy', 'name email')
        .sort({ updatedAt: -1 })
        .lean()
    ]);

    return {
      pendingRecruiters,
      pendingCompanies,
      verifiedCompanies,
      activeJobs,
      reportedJobs,
      counts: {
        pendingRecruiters: pendingRecruiters.length,
        pendingCompanies: pendingCompanies.length,
        verifiedCompanies: verifiedCompanies.length,
        activeJobs: activeJobs.length,
        reportedJobs: reportedJobs.length
      }
    };
  } catch (error) {
    console.error('Error fetching moderation overview:', error);
    throw error;
  }
};