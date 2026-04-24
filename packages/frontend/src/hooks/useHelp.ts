import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export function useHelp(moduleKey: string, lang: string = 'vi') {
  return useQuery({
    queryKey: ['help', moduleKey, lang],
    queryFn: async () => {
      const response = await apiClient.get(`/help/${moduleKey}?lang=${lang}`);
      // apiClient.interceptors.response.use in api/client.ts already handles the response structure
      // but let's check if it returns data.data or just data based on TransformInterceptor
      return response.data.data as string;
    },
    enabled: !!moduleKey,
  });
}
