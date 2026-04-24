import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';

export interface SystemStatus {
  initialized: boolean;
  hasAdmin: boolean;
  moduleCount: number;
  groupCount: number;
}

export function useSystemStatus() {
  return useQuery<SystemStatus>({
    queryKey: ['system-status'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SystemStatus>>('/system/status');
      return data.data;
    },
    staleTime: 0,
    retry: false,
  });
}
