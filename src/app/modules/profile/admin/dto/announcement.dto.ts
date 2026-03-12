export interface AnnouncementDTO {
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "error";
  targetAudience?: "all" | "candidate" | "recruiter";
  createdBy: string;
  isActive?: boolean;
}
