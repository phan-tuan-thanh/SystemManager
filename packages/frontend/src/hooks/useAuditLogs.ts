import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { AuditLog, AuditLogFilter } from '../types/audit';

interface AuditListData {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export function useAuditLogList(params: AuditLogFilter = {}) {
  return useQuery<AuditListData>({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuditLog[]>>('/audit-logs', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useAuditLogDetail(id: string | null) {
  return useQuery<AuditLog>({
    queryKey: ['audit-logs', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function buildAuditCsvUrl(params: AuditLogFilter): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  });
  const base = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1';
  return `${base}/audit-logs/export?${qs.toString()}`;
}
