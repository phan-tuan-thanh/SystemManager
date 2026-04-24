import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { AppConnection, AppDependencies, ConnectionFilter } from '../types/connection';

interface ConnectionListData {
  items: AppConnection[];
  total: number;
  page: number;
  limit: number;
}

export function useConnectionList(params: ConnectionFilter = {}) {
  return useQuery<ConnectionListData>({
    queryKey: ['connections', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AppConnection[]>>('/connections', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useConnectionDetail(id: string | null) {
  return useQuery<AppConnection>({
    queryKey: ['connections', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AppConnection>>(`/connections/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<AppConnection>) => {
      const { data } = await apiClient.post<ApiResponse<AppConnection>>('/connections', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  });
}

export function useUpdateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<AppConnection> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<AppConnection>>(`/connections/${id}`, dto);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['connections'] });
      qc.invalidateQueries({ queryKey: ['connections', variables.id] });
    },
  });
}

export function useDeleteConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/connections/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  });
}

export function useAppDependencies(applicationId: string | null, environment?: string) {
  return useQuery<AppDependencies>({
    queryKey: ['app-dependencies', applicationId, environment],
    queryFn: async () => {
      const params = environment ? { environment } : {};
      const { data } = await apiClient.get<ApiResponse<AppDependencies>>(
        `/applications/${applicationId}/dependencies`,
        { params },
      );
      return data.data;
    },
    enabled: !!applicationId,
  });
}
