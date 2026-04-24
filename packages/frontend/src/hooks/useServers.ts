import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { Server, ServerDetail } from '../types/server';
import type { ChangeHistoryItem } from '../components/common/ChangeHistoryTimeline';

export interface ServerListParams {
  page?: number;
  limit?: number;
  environment?: string;
  status?: string;
  infra_type?: string;
  site?: string;
  search?: string;
}

interface ServerListData {
  items: Server[];
  total: number;
  page: number;
  limit: number;
}

export function useServerList(params: ServerListParams = {}) {
  return useQuery<ServerListData>({
    queryKey: ['servers', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Server[]>>('/servers', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useServerDetail(id: string) {
  return useQuery<ServerDetail>({
    queryKey: ['servers', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ServerDetail>>(`/servers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Omit<Server, 'id' | 'created_at' | 'updated_at'>) => {
      const { data } = await apiClient.post<ApiResponse<Server>>('/servers', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}

export function useUpdateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Server> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Server>>(`/servers/${id}`, dto);
      return data.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['servers'] });
      qc.invalidateQueries({ queryKey: ['servers', vars.id] });
    },
  });
}

export function useDeleteServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/servers/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}

export function useServerChangeHistory(id: string, enabled = false) {
  return useQuery<ChangeHistoryItem[]>({
    queryKey: ['servers', id, 'change-history'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ChangeHistoryItem[]>>(
        `/servers/${id}/change-history`,
      );
      return data.data;
    },
    enabled: !!id && enabled,
  });
}
