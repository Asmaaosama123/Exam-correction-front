export interface ComplaintResponse {
  id: number;
  message: string;
  createdAt: string;
  teacherName: string;
  adminResponse?: string;
  isResolved: boolean;
  resolvedAt?: string;
}

export interface ResolveComplaintRequest {
  id: number;
  adminResponse: string;
}

export interface CreateComplaintRequest {
  message: string;
}
