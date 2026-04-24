import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { NetworkConfig } from '../types/server';

export interface NetworkListParams {
  server_id?: string;
  environment?: string;
  ip?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface NetworkListData {
  items: NetworkConfig[];
  total: number;
}

export function useNetworkConfigList(params: NetworkListParams = {}) {
  return useQuery<NetworkListData>({
    queryKey: ['network-configs', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<NetworkConfig[]>>('/network-configs', { params });
      return { items: data.data, total: data.meta?.total ?? 0 };
    },
  });
}

export function useCreateNetworkConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<NetworkConfig> & { server_id: string }) => {
      const { data } = await apiClient.post<ApiResponse<NetworkConfig>>('/network-configs', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['network-configs'] }),
  });
}

export function useUpdateNetworkConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<NetworkConfig> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<NetworkConfig>>(`/network-configs/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['network-configs'] }),
  });
}

export function useDeleteNetworkConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/network-configs/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['network-configs'] }),
  });
}
