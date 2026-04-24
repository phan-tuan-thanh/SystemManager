import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { ApplicationGroup, GroupType } from '../types/application';

export interface AppGroupParams {
  page?: number;
  limit?: number;
  search?: string;
  group_type?: GroupType;
}

interface AppGroupListData {
  items: ApplicationGroup[];
  total: number;
  page: number;
  limit: number;
}

export function useAppGroupList(params: AppGroupParams = {}) {
  return useQuery<AppGroupListData>({
    queryKey: ['app-groups', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ApplicationGroup[]>>('/app-groups', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useAppGroupDetail(id: string) {
  return useQuery<ApplicationGroup>({
    queryKey: ['app-groups', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ApplicationGroup>>(`/app-groups/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateAppGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<ApplicationGroup>) => {
      const { data } = await apiClient.post<ApiResponse<ApplicationGroup>>('/app-groups', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-groups'] }),
  });
}

export function useUpdateAppGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<ApplicationGroup> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<ApplicationGroup>>(`/app-groups/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-groups'] }),
  });
}

export function useDeleteAppGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/app-groups/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-groups'] }),
  });
}
