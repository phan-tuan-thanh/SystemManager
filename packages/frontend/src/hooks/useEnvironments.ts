import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { EnvironmentConfig } from '../types/environment';

interface ApiListResponse<T> {
  data: T[];
}

const QUERY_KEY = ['environments'] as const;

export function useEnvironments() {
  return useQuery<EnvironmentConfig[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiListResponse<EnvironmentConfig>>('/environments', {
        params: { all: 'true' },
      });
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveEnvironments() {
  return useQuery<EnvironmentConfig[]>({
    queryKey: [...QUERY_KEY, 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiListResponse<EnvironmentConfig>>('/environments');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<EnvironmentConfig>) =>
      apiClient.post('/environments', dto).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: Partial<EnvironmentConfig> & { id: string }) =>
      apiClient.patch(`/environments/${id}`, dto).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeactivateEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/environments/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useReorderEnvironments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (codes: string[]) =>
      apiClient.patch('/environments/reorder', { codes }).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
