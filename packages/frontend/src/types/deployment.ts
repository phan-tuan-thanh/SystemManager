import type { Environment } from './server';

export type DeploymentStatus = 'RUNNING' | 'STOPPED' | 'DEPRECATED';
export type DocStatus = 'PENDING' | 'PREVIEW' | 'COMPLETE' | 'WAIVED';

export interface DeploymentDocType {
  id: string;
  code: string;
  name: string;
  description?: string;
  required: boolean;
  environments: Environment[];
  sort_order: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface DeploymentDoc {
  id: string;
  deployment_id: string;
  doc_type_id: string;
  status: DocStatus;
  preview_path?: string;
  final_path?: string;
  waived_reason?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  doc_type: DeploymentDocType;
}

export interface AppDeployment {
  id: string;
  application_id: string;
  server_id: string;
  environment: Environment;
  version: string;
  status: DeploymentStatus;
  title?: string;
  deployed_at?: string;
  planned_at?: string;
  cmc_name?: string;
  deployer?: string;
  created_at: string;
  updated_at: string;
  application?: { id: string; code: string; name: string };
  server?: { id: string; code: string; name: string; environment: Environment };
  _count?: { docs: number };
}

export interface DeploymentDetail extends AppDeployment {
  application: { id: string; code: string; name: string; group: { id: string; name: string } };
  server: { id: string; code: string; name: string; environment: Environment; site: string };
  docs: DeploymentDoc[];
  ports: { id: string; port_number: number; protocol: string; description?: string }[];
  doc_progress: {
    total: number;
    complete: number;
    waived: number;
    pending: number;
    pct: number;
  };
}
