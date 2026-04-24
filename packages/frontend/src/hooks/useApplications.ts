import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { Application, ApplicationDetail, SystemSoftware, WhereRunning, Port, GroupType } from '../types/application';

export interface ApplicationParams {
  page?: number;
  limit?: number;
  search?: string;
  group_id?: string;
  status?: string;
  environment?: string;
  application_type?: 'BUSINESS' | 'SYSTEM';
  sw_type?: string;
  group_type?: GroupType;
}

interface ApplicationListData {
  items: Application[];
  total: number;
  page: number;
  limit: number;
}

export function useApplicationList(params: ApplicationParams = {}) {
  return useQuery<ApplicationListData>({
    queryKey: ['applications', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Application[]>>('/applications', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useApplicationDetail(id: string) {
  return useQuery<ApplicationDetail>({
    queryKey: ['applications', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ApplicationDetail>>(`/applications/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useApplicationWhereRunning(id: string) {
  return useQuery<WhereRunning[]>({
    queryKey: ['applications', id, 'where-running'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<WhereRunning[]>>(`/applications/${id}/where-running`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<Application>) => {
      const { data } = await apiClient.post<ApiResponse<Application>>('/applications', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Application> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Application>>(`/applications/${id}`, dto);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['applications', variables.id] });
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/applications/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useApplicationChangeHistory(id: string, enabled = false) {
  return useQuery({
    queryKey: ['applications', id, 'change-history'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<any[]>>(`/applications/${id}/change-history`);
      return data.data;
    },
    enabled: !!id && enabled,
  });
}

// ─── SystemSoftware hooks ──────────────────────────────────────────────────

export interface SystemSoftwareParams {
  page?: number;
  limit?: number;
  search?: string;
  group_id?: string;
  sw_type?: string;
}

interface SystemSoftwareListData {
  items: SystemSoftware[];
  total: number;
  page: number;
  limit: number;
}

export function useSystemSoftwareList(params: SystemSoftwareParams = {}) {
  return useQuery<SystemSoftwareListData>({
    queryKey: ['system-software', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SystemSoftware[]>>('/system-software', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useCreateSystemSoftware() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<SystemSoftware>) => {
      const { data } = await apiClient.post<ApiResponse<SystemSoftware>>('/system-software', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-software'] }),
  });
}

export function useUpdateSystemSoftware() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<SystemSoftware> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<SystemSoftware>>(`/system-software/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-software'] }),
  });
}

export function useDeleteSystemSoftware() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/system-software/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-software'] }),
  });
}

// ─── Port hooks ──────────────────────────────────────────────────────────────

export interface PortParams {
  page?: number;
  limit?: number;
  application_id?: string;
  deployment_id?: string;
  protocol?: string;
  port_number?: number;
}

interface PortListData {
  items: Port[];
  total: number;
  page: number;
  limit: number;
}

export function usePortList(params: PortParams = {}) {
  return useQuery<PortListData>({
    queryKey: ['ports', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Port[]>>('/ports', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useCreatePort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<Port>) => {
      const { data } = await apiClient.post<ApiResponse<Port>>('/ports', dto);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ports'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useUpdatePort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Port> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Port>>(`/ports/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ports'] }),
  });
}

export function useDeletePort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/ports/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ports'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
