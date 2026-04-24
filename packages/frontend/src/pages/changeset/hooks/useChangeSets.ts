import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/client';

export interface ChangeItem {
  id: string;
  changeset_id: string;
  resource_type: string;
  resource_id: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  created_at: string;
}

export interface ChangeSet {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PREVIEWING' | 'APPLIED' | 'DISCARDED';
  environment?: string;
  created_by: string;
  applied_at?: string;
  created_at: string;
  updated_at: string;
  creator: { id: string; full_name: string; email: string };
  items?: ChangeItem[];
  _count?: { items: number };
}

export interface ConflictWarning {
  type: 'IP_CONFLICT' | 'PORT_CONFLICT' | 'CIRCULAR_DEP';
  severity: 'ERROR' | 'WARNING';
  message: string;
  affected_resources: string[];
}

export interface PreviewResult {
  changeset_id: string;
  environment: string | null;
  change_summary: { created: number; updated: number; deleted: number };
  conflicts: ConflictWarning[];
  has_fatal_conflicts: boolean;
  virtual_topology: {
    servers: any[];
    network_configs: any[];
    applications: any[];
    connections: any[];
    deployments: any[];
    ports: any[];
  };
}

const BASE = '/changesets';

export function useChangeSetList(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['changesets', params],
    queryFn: () => apiClient.get(BASE, { params }).then((r) => r.data),
  });
}

export function useChangeSetDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['changesets', id],
    queryFn: () => apiClient.get(`${BASE}/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateChangeSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; environment?: string }) =>
      apiClient.post(BASE, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['changesets'] }),
  });
}

export function useDiscardChangeSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`${BASE}/${id}/discard`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['changesets'] }),
  });
}

export function useAddChangeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ changesetId, data }: { changesetId: string; data: Omit<ChangeItem, 'id' | 'changeset_id' | 'created_at'> }) =>
      apiClient.post(`${BASE}/${changesetId}/items`, data).then((r) => r.data.data),
    onSuccess: (_, { changesetId }) => qc.invalidateQueries({ queryKey: ['changesets', changesetId] }),
  });
}

export function useRemoveChangeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ changesetId, itemId }: { changesetId: string; itemId: string }) =>
      apiClient.delete(`${BASE}/${changesetId}/items/${itemId}`),
    onSuccess: (_, { changesetId }) => qc.invalidateQueries({ queryKey: ['changesets', changesetId] }),
  });
}

export function usePreviewChangeSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`${BASE}/${id}/preview`).then((r) => r.data.data as PreviewResult),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ['changesets', id] }),
  });
}

export function useApplyChangeSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`${BASE}/${id}/apply`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['changesets'] }),
  });
}
