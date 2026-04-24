import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { AppDeployment, DeploymentDetail, DeploymentDocType, DeploymentDoc } from '../types/deployment';

export interface DeploymentParams {
  page?: number;
  limit?: number;
  search?: string;
  application_id?: string;
  server_id?: string;
  environment?: string;
  status?: string;
}

interface DeploymentListData {
  items: AppDeployment[];
  total: number;
  page: number;
  limit: number;
}

export function useDeploymentList(params: DeploymentParams = {}) {
  return useQuery<DeploymentListData>({
    queryKey: ['deployments', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AppDeployment[]>>('/deployments', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useDeploymentDetail(id: string) {
  return useQuery<DeploymentDetail>({
    queryKey: ['deployments', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DeploymentDetail>>(`/deployments/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<AppDeployment>) => {
      const { data } = await apiClient.post<ApiResponse<AppDeployment>>('/deployments', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deployments'] }),
  });
}

export function useUpdateDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<AppDeployment> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<AppDeployment>>(`/deployments/${id}`, dto);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['deployments'] });
      qc.invalidateQueries({ queryKey: ['deployments', variables.id] });
    },
  });
}

export function useDeleteDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/deployments/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deployments'] }),
  });
}

// ─── DeploymentDoc file upload hooks ──────────────────────────────────────

export function useUploadDocPreview(deploymentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ docTypeId, file }: { docTypeId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post<ApiResponse<DeploymentDoc>>(
        `/deployments/${deploymentId}/docs/${docTypeId}/preview`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deployments', deploymentId] }),
  });
}

export function useUploadDocFinal(deploymentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ docTypeId, file }: { docTypeId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post<ApiResponse<DeploymentDoc>>(
        `/deployments/${deploymentId}/docs/${docTypeId}/final`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deployments', deploymentId] }),
  });
}

export function useWaiveDoc(deploymentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ docTypeId, reason }: { docTypeId: string; reason: string }) => {
      const { data } = await apiClient.patch<ApiResponse<DeploymentDoc>>(
        `/deployments/${deploymentId}/docs/${docTypeId}/waive`,
        { reason },
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deployments', deploymentId] }),
  });
}

// ─── DeploymentDocType hooks ─────────────────────────────────────────────

interface DocTypeListData {
  items: DeploymentDocType[];
  total: number;
  page: number;
  limit: number;
}

export function useDocTypeList(params: { page?: number; limit?: number } = {}) {
  return useQuery<DocTypeListData>({
    queryKey: ['doc-types', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DeploymentDocType[]>>('/deployment-doc-types', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 50,
      };
    },
  });
}

export function useCreateDocType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<DeploymentDocType>) => {
      const { data } = await apiClient.post<ApiResponse<DeploymentDocType>>('/deployment-doc-types', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doc-types'] }),
  });
}

export function useUpdateDocType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<DeploymentDocType> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<DeploymentDocType>>(`/deployment-doc-types/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doc-types'] }),
  });
}

export function useDeleteDocType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/deployment-doc-types/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doc-types'] }),
  });
}
