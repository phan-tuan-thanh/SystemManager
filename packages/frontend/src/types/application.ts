import type { Environment } from './server';

export type AppStatus = 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
export type SoftwareType = 'OS' | 'RUNTIME' | 'DATABASE' | 'MIDDLEWARE' | 'LIBRARY' | 'TOOL' | 'OTHER' | 'WEB_SERVER';
export type GroupType = 'BUSINESS' | 'INFRASTRUCTURE';

export interface ApplicationGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  group_type: GroupType;
  created_at: string;
  updated_at: string;
  _count?: { applications: number; system_software: number };
}

export interface Application {
  id: string;
  group_id: string;
  code: string;
  name: string;
  description?: string;
  status?: AppStatus;
  application_type: 'BUSINESS' | 'SYSTEM';
  sw_type?: SoftwareType;
  eol_date?: string;
  vendor?: string;
  version?: string;
  owner_team?: string;
  tech_stack?: string;
  repo_url?: string;
  created_at: string;
  updated_at: string;
  group?: ApplicationGroup;
}

export interface ApplicationDetail extends Application {
  app_deployments?: {
    id: string;
    environment: Environment;
    version: string;
    status: string;
    server: { id: string; code: string; name: string };
  }[];
  ports?: Port[];
}

export interface Port {
  id: string;
  application_id: string;
  deployment_id?: string;
  port_number: number;
  protocol: 'TCP' | 'UDP';
  description?: string;
  created_at: string;
  updated_at: string;
  application?: { id: string; code: string; name: string };
  deployment?: { id: string; version: string; server: { code: string; name: string } };
}

export interface SystemSoftware {
  id: string;
  group_id: string;
  code: string;
  name: string;
  version?: string;
  sw_type: SoftwareType;
  vendor?: string;
  eol_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  group?: ApplicationGroup;
}

export interface WhereRunning {
  environment: Environment;
  servers: { server_id: string; server_code: string; server_name: string; deployment_id: string; version: string; status: string }[];
}
