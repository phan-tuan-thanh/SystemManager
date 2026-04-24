import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { HardwareComponent } from '../types/server';

export interface HardwareListParams {
  server_id?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface HardwareListData {
  items: HardwareComponent[];
  total: number;
}

export function useHardwareList(params: HardwareListParams = {}) {
  return useQuery<HardwareListData>({
    queryKey: ['hardware', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<HardwareComponent[]>>('/hardware', { params });
      return { items: data.data, total: data.meta?.total ?? 0 };
    },
  });
}

export function useCreateHardware() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      server_id: string;
      type: string;
      model?: string;
      manufacturer?: string;
      serial?: string;
      specs?: Record<string, unknown>;
    }) => {
      const { data } = await apiClient.post<ApiResponse<HardwareComponent>>('/hardware', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hardware'] }),
  });
}

export function useUpdateHardware() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<HardwareComponent> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<HardwareComponent>>(`/hardware/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hardware'] }),
  });
}

export function useDetachHardware() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/hardware/${id}/detach`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hardware'] }),
  });
}

export function useAttachHardware() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, server_id }: { id: string; server_id: string }) => {
      const { data } = await apiClient.post<ApiResponse<HardwareComponent>>(
        `/hardware/${id}/attach`,
        { server_id },
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hardware'] }),
  });
}

export function useHardwareChangeHistory(id: string, enabled = false) {
  return useQuery({
    queryKey: ['hardware', id, 'history'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/hardware/${id}/history`);
      return (data as ApiResponse<unknown[]>).data;
    },
    enabled: !!id && enabled,
  });
}
