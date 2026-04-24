import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { ModuleConfig } from '../types/user';

export function useModuleConfigList() {
  return useQuery<ModuleConfig[]>({
    queryKey: ['module-configs'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ModuleConfig[]>>('/module-configs');
      return data.data;
    },
  });
}

export function useToggleModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (moduleKey: string) => {
      const { data } = await apiClient.patch<ApiResponse<ModuleConfig>>(`/module-configs/${moduleKey}/toggle`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-configs'] }),
  });
}
