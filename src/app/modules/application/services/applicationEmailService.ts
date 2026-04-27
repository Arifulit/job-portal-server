import { sendEmail } from "../../../utils/mailer";

type ApplicationSubmittedEmailInput = {
  to: string;
  candidateName?: string;
  jobTitle?: string;
};

type ApplicationStatusEmailInput = {
  to: string;
  candidateName?: string;
  status: "Applied" | "Reviewed" | "Rejected" | "Accepted";
  jobTitle?: string;
};

const formatCandidateName = (name?: string) => (name?.trim() ? name : "Candidate");
const formatJobTitle = (title?: string) => (title?.trim() ? title : "the selected position");

export const sendApplicationSubmittedEmail = async ({
  to,
  candidateName,
  jobTitle,
}: ApplicationSubmittedEmailInput): Promise<void> => {
  const safeCandidateName = formatCandidateName(candidateName);
  const safeJobTitle = formatJobTitle(jobTitle);

  const subject = "Your application has been submitted";
  const text = `Hello ${safeCandidateName},\n\nYour application for ${safeJobTitle} has been submitted successfully.\n\nThank you.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 640px; margin: 0 auto;">
      <h2>Application Submitted</h2>
      <p>Hello ${safeCandidateName},</p>
      <p>Your application for <strong>${safeJobTitle}</strong> has been submitted successfully.</p>
      <p>Thank you.</p>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
};

export const sendApplicationStatusUpdatedEmail = async ({
  to,
  candidateName,
  status,
  jobTitle,
}: ApplicationStatusEmailInput): Promise<void> => {
  const safeCandidateName = formatCandidateName(candidateName);
  const safeJobTitle = formatJobTitle(jobTitle);

  const statusLabel = status.toLowerCase();
  const subject = `Your application was ${statusLabel}`;
  const text = `Hello ${safeCandidateName},\n\nYour application for ${safeJobTitle} was ${statusLabel}.\n\nThank you.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 640px; margin: 0 auto;">
      <h2>Application Status Updated</h2>
      <p>Hello ${safeCandidateName},</p>
      <p>Your application for <strong>${safeJobTitle}</strong> was <strong>${statusLabel}</strong>.</p>
      <p>Thank you.</p>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
};
