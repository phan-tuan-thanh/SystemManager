import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/client';
import type { ApiResponse } from '../../../types/auth';
import type { FirewallRule, FirewallAction, FirewallRuleStatus } from '../../../types/firewall-rule';
import type { FirewallEnvironment } from '../../../types/network-zone';

// ─── Params & DTOs ─────────────────────────────────────────────────────────────

export interface FirewallRuleListParams {
  environment?: FirewallEnvironment;
  action?: FirewallAction;
  status?: FirewallRuleStatus;
  source_zone_id?: string;
  destination_server_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateFirewallRuleDto {
  name: string;
  description?: string;
  environment: FirewallEnvironment;
  source_zone_id?: string;
  source_ip?: string;
  destination_zone_id?: string;
  destination_server_id: string;
  destination_port_id?: string;
  protocol: string;
  action: FirewallAction;
  status: FirewallRuleStatus;
  request_date?: string;
  approved_by?: string;
  notes?: string;
}

export type UpdateFirewallRuleDto = Partial<CreateFirewallRuleDto> & { id: string };

interface FirewallRuleListData {
  items: FirewallRule[];
  total: number;
  page: number;
  limit: number;
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useFirewallRuleList(params: FirewallRuleListParams = {}) {
  return useQuery<FirewallRuleListData>({
    queryKey: ['firewall-rules', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<FirewallRule[]>>('/firewall-rules', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useCreateFirewallRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateFirewallRuleDto) => {
      const { data } = await apiClient.post<ApiResponse<FirewallRule>>('/firewall-rules', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['firewall-rules'] }),
  });
}

export function useUpdateFirewallRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateFirewallRuleDto) => {
      const { data } = await apiClient.patch<ApiResponse<FirewallRule>>(`/firewall-rules/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['firewall-rules'] }),
  });
}

export function useDeleteFirewallRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/firewall-rules/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['firewall-rules'] }),
  });
}

// ─── Export utility ────────────────────────────────────────────────────────────

export async function exportFirewallRules(params: FirewallRuleListParams = {}): Promise<void> {
  const response = await apiClient.get('/firewall-rules/export', {
    params,
    responseType: 'blob',
  });

  const blob = new Blob([response.data as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `firewall-rules-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
