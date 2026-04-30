import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { complaintsApi } from '@/lib/complaints-api';
import type { CreateComplaintRequest, ResolveComplaintRequest } from '@/types/complaints';

export const COMPLAINTS_QUERY_KEY = ['complaints'];

export function useComplaints() {
  return useQuery({
    queryKey: COMPLAINTS_QUERY_KEY,
    queryFn: complaintsApi.getComplaints,
  });
}

export function useMyComplaints() {
  return useQuery({
    queryKey: ['my-complaints'],
    queryFn: complaintsApi.getMyComplaints,
  });
}

export function useResolveComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResolveComplaintRequest) => complaintsApi.resolveComplaint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
    },
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateComplaintRequest) => complaintsApi.createComplaint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
    },
  });
}
