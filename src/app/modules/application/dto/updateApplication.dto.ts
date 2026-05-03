export interface UpdateApplicationDTO {
  status?: "Applied" | "Reviewed" | "Shortlisted" | "Interview" | "Rejected" | "Accepted";
  resume?: string;
  coverLetter?: string;
}
