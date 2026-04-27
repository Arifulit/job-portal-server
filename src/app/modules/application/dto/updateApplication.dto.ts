export interface UpdateApplicationDTO {
  status?: "Applied" | "Reviewed" | "Rejected" | "Accepted";
  resume?: string;
  coverLetter?: string;
}
