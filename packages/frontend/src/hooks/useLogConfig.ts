import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import logger from '../utils/logger';

export interface LogConfig {
  enabled: boolean;
  level: 'error' | 'warn' | 'log' | 'debug' | 'verbose';
  toFile: boolean;
  toConsole: boolean;
}

export function useLogConfig() {
  return useQuery<LogConfig>({
    queryKey: ['log-config'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<LogConfig>>('/admin/system-config/logging');
      const config = data.data;
      // Apply to frontend logger — map backend 'log' → frontend 'info'
      const frontendLevel = config.level === 'log' ? 'info' : (config.level as 'error' | 'warn' | 'info' | 'debug');
      logger.configure(frontendLevel, config.enabled);
      return config;
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useUpdateLogConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<LogConfig>) => {
      const { data } = await apiClient.patch<ApiResponse<LogConfig>>('/admin/system-config/logging', dto);
      return data.data;
    },
    onSuccess: (updated) => {
      qc.setQueryData(['log-config'], updated);
      const frontendLevel = updated.level === 'log' ? 'info' : (updated.level as 'error' | 'warn' | 'info' | 'debug');
      logger.configure(frontendLevel, updated.enabled);
    },
  });
}
