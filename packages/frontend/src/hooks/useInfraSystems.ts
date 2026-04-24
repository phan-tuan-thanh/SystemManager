import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';

export interface InfraSystem {
  id: string;
  code: string;
  name: string;
  description?: string;
  server_count?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface InfraSystemDetail extends InfraSystem {
  servers: Array<{
    id: string;
    code: string;
    name: string;
    hostname: string;
    environment: string;
    status: string;
  }>;
}

export interface InfraSystemAccess {
  id: string;
  system_id: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
  group?: {
    id: string;
    code: string;
    name: string;
  };
  created_at: string;
}

export interface InfraSystemListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface InfraSystemListData {
  items: InfraSystem[];
  total: number;
  page: number;
  limit: number;
}

interface CsvImportResult {
  servers: { created: string[]; duplicate: string[] };
  apps: { created: string[]; duplicate: string[] };
  errors: Array<{ row: number; message: string }>;
}

export function useInfraSystemList(params: InfraSystemListParams = {}) {
  return useQuery<InfraSystemListData>({
    queryKey: ['infra-systems', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<InfraSystem[]>>('/infra-systems', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useInfraSystemDetail(id: string) {
  return useQuery<InfraSystemDetail>({
    queryKey: ['infra-systems', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<InfraSystemDetail>>(`/infra-systems/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateInfraSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Omit<InfraSystem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data } = await apiClient.post<ApiResponse<InfraSystem>>('/infra-systems', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['infra-systems'] }),
  });
}

export function useUpdateInfraSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<InfraSystem> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<InfraSystem>>(`/infra-systems/${id}`, dto);
      return data.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['infra-systems'] });
      qc.invalidateQueries({ queryKey: ['infra-systems', vars.id] });
    },
  });
}

export function useDeleteInfraSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/infra-systems/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['infra-systems'] }),
  });
}

export function useInfraSystemAccess(systemId: string) {
  return useQuery<InfraSystemAccess[]>({
    queryKey: ['infra-systems', systemId, 'access'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<InfraSystemAccess[]>>(
        `/infra-systems/${systemId}/access`,
      );
      return data.data;
    },
    enabled: !!systemId,
  });
}

export function useGrantSystemAccess(systemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { user_id?: string; group_id?: string }) => {
      const { data } = await apiClient.post<ApiResponse<InfraSystemAccess>>(
        `/infra-systems/${systemId}/access`,
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infra-systems', systemId, 'access'] });
    },
  });
}

export function useRevokeSystemAccess(systemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accessId: string) => {
      await apiClient.delete(`/infra-systems/${systemId}/access/${accessId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infra-systems', systemId, 'access'] });
    },
  });
}

export function useImportInfraSystems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, environment = 'AUTOMATIC', site = 'AUTOMATIC', system_id = 'AUTOMATIC' }: { file: File; environment?: string; site?: string; system_id?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('environment', environment);
      formData.append('site', site);
      formData.append('system_id', system_id);

      const { data } = await apiClient.post<ApiResponse<CsvImportResult>>(
        '/infra-systems/import',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infra-systems'] });
    },
  });
}
