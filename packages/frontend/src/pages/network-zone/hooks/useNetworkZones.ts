import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/client';
import type { ApiResponse } from '../../../types/auth';
import type {
  NetworkZone,
  NetworkZoneMeta,
  ZoneIpEntry,
  NetworkZoneType,
  FirewallEnvironment,
} from '../../../types/network-zone';

// ─── List / Detail params ──────────────────────────────────────────────────────

export interface NetworkZoneListParams {
  environment?: FirewallEnvironment;
  zone_type?: NetworkZoneType;
  search?: string;
  page?: number;
  limit?: number;
}

interface NetworkZoneListData {
  items: NetworkZone[];
  total: number;
  meta: NetworkZoneMeta;
}

// ─── Create / Update DTOs ──────────────────────────────────────────────────────

export interface CreateNetworkZoneDto {
  name: string;
  code: string;
  zone_type: NetworkZoneType;
  environment: FirewallEnvironment;
  description?: string;
  color?: string;
}

export type UpdateNetworkZoneDto = Partial<CreateNetworkZoneDto> & { id: string };

// ─── IP DTOs ───────────────────────────────────────────────────────────────────

export interface AddZoneIpDto {
  zoneId: string;
  ip_address: string;
  label?: string;
  description?: string;
  is_range?: boolean;
}

export interface BulkImportIpsDto {
  zoneId: string;
  ips: string[];
}

export interface RemoveZoneIpDto {
  zoneId: string;
  ipId: string;
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useNetworkZoneList(params: NetworkZoneListParams = {}) {
  return useQuery<NetworkZoneListData>({
    queryKey: ['network-zones', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<NetworkZone[]>>('/network-zones', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        meta: data.meta as NetworkZoneMeta,
      };
    },
  });
}

export function useNetworkZoneDetail(id: string) {
  return useQuery<NetworkZone>({
    queryKey: ['network-zones', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<NetworkZone>>(`/network-zones/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateNetworkZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateNetworkZoneDto) => {
      const { data } = await apiClient.post<ApiResponse<NetworkZone>>('/network-zones', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['network-zones'] }),
  });
}

export function useUpdateNetworkZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateNetworkZoneDto) => {
      const { data } = await apiClient.patch<ApiResponse<NetworkZone>>(`/network-zones/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['network-zones'] }),
  });
}

export function useDeleteNetworkZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/network-zones/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['network-zones'] }),
  });
}

export function useZoneIpList(zoneId: string) {
  return useQuery<ZoneIpEntry[]>({
    queryKey: ['network-zones', zoneId, 'ips'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ZoneIpEntry[]>>(`/network-zones/${zoneId}/ips`);
      return data.data;
    },
    enabled: !!zoneId,
  });
}

export function useAddZoneIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ zoneId, ...dto }: AddZoneIpDto) => {
      const { data } = await apiClient.post<ApiResponse<ZoneIpEntry>>(
        `/network-zones/${zoneId}/ips`,
        dto,
      );
      return data.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['network-zones', vars.zoneId, 'ips'] });
      qc.invalidateQueries({ queryKey: ['network-zones'] });
    },
  });
}

export function useBulkImportIps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ zoneId, ips }: BulkImportIpsDto) => {
      const { data } = await apiClient.post<ApiResponse<ZoneIpEntry[]>>(
        `/network-zones/${zoneId}/ips/bulk`,
        { ips },
      );
      return data.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['network-zones', vars.zoneId, 'ips'] });
      qc.invalidateQueries({ queryKey: ['network-zones'] });
    },
  });
}

export function useRemoveZoneIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ zoneId, ipId }: RemoveZoneIpDto) => {
      await apiClient.delete(`/network-zones/${zoneId}/ips/${ipId}`);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['network-zones', vars.zoneId, 'ips'] });
      qc.invalidateQueries({ queryKey: ['network-zones'] });
    },
  });
}
