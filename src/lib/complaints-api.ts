import { api } from './api';
import type { ComplaintResponse, CreateComplaintRequest } from '@/types/complaints';

export const complaintsApi = {
  createComplaint: async (data: CreateComplaintRequest): Promise<void> => {
    await api.post('/api/Complaints', data);
  },

  getComplaints: async (): Promise<ComplaintResponse[]> => {
    const response = await api.get<ComplaintResponse[]>('/api/Complaints');
    return response.data;
  },

  getMyComplaints: async (): Promise<ComplaintResponse[]> => {
    const response = await api.get<ComplaintResponse[]>('/api/Complaints/my');
    return response.data;
  },

  resolveComplaint: async (data: ResolveComplaintRequest): Promise<void> => {
    await api.put('/api/Complaints/resolve', data);
  }
};
