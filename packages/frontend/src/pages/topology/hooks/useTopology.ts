import { useQuery } from '@apollo/client';
import { TOPOLOGY_QUERY, APP_DEPENDENCY_QUERY } from '../../../graphql/topology';
import apiClient from '../../../api/client';
import { useQuery as useTanstackQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── GraphQL hooks ────────────────────────────────────────────────

export interface NetworkConfigNode {
  id: string;
  interface?: string;
  private_ip?: string;
  public_ip?: string;
  domain?: string;
}

export interface PortNode {
  id: string;
  port_number: number;
  protocol: string;
  service_name?: string;
}

export interface ApplicationNode {
  id: string;
  code: string;
  name: string;
  version?: string;
  groupName?: string;
  owner_team?: string;
  application_type?: string;  // 'BUSINESS' | 'SYSTEM'
  ports?: PortNode[];
}

export interface DeploymentNode {
  id: string;
  version: string;
  status: string;
  environment: string;
  application: ApplicationNode;
}

export interface ServerNode {
  id: string;
  code: string;
  name: string;
  hostname: string;
  purpose: string;
  status: string;
  environment: string;
  infra_type: string;
  site: string;
  description?: string;
  deployments: DeploymentNode[];
  networkConfigs: NetworkConfigNode[];
}

export interface ConnectionEdge {
  id: string;
  sourceAppId: string;
  targetAppId: string;
  sourceAppName: string;
  targetAppName: string;
  connectionType: string;
  environment: string;
  description?: string;
  targetPort?: {
    id: string;
    port_number: number;
    protocol: string;
    service_name?: string;
  };
}

export interface TopologyData {
  servers: ServerNode[];
  connections: ConnectionEdge[];
}

export function useTopologyQuery(environment?: string) {
  return useQuery<{ topology: TopologyData }>(TOPOLOGY_QUERY, {
    variables: { environment: environment || null },
    fetchPolicy: 'cache-and-network',
  });
}

export function useAppDependencyQuery(appId: string, skip = false) {
  return useQuery<{ appDependency: { upstream: ConnectionEdge[]; downstream: ConnectionEdge[] } }>(
    APP_DEPENDENCY_QUERY,
    { variables: { appId }, skip },
  );
}

// ─── REST hooks for snapshots ────────────────────────────────────

export interface Snapshot {
  id: string;
  label?: string;
  environment?: string;
  created_by?: string;
  created_at: string;
}

export function useSnapshotList(environment?: string, page = 1) {
  return useTanstackQuery({
    queryKey: ['snapshots', environment, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (environment) params.set('environment', environment);
      const res = await apiClient.get(`/api/v1/topology-snapshots?${params}`);
      return res.data as { data: Snapshot[]; meta: { total: number; page: number; limit: number } };
    },
  });
}

export function useSnapshotDetail(id: string) {
  return useTanstackQuery({
    queryKey: ['snapshots', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/topology-snapshots/${id}`);
      return res.data as { data: Snapshot & { payload: TopologyData } };
    },
    enabled: !!id,
  });
}

export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { label?: string; environment?: string }) => {
      const res = await apiClient.post('/api/v1/topology-snapshots', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['snapshots'] }),
  });
}
