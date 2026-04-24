export type Environment = 'DEV' | 'UAT' | 'PROD';
export type ServerStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type ServerPurpose = 'APP_SERVER' | 'DB_SERVER' | 'PROXY' | 'LOAD_BALANCER' | 'CACHE' | 'MESSAGE_QUEUE' | 'OTHER';
export type InfraType = 'VIRTUAL_MACHINE' | 'PHYSICAL_SERVER' | 'CONTAINER' | 'CLOUD_INSTANCE';
export type Site = 'DC' | 'DR';
export type HardwareType = 'CPU' | 'RAM' | 'HDD' | 'SSD' | 'NETWORK_CARD';

export interface Server {
  id: string;
  code: string;
  name: string;
  hostname: string;
  purpose: ServerPurpose;
  status: ServerStatus;
  environment: Environment;
  infra_type: InfraType;
  site: Site;
  description?: string;
  os?: string;
  infra_system_id?: string | null;
  infra_system?: { id: string; code: string; name: string } | null;
  app_count?: number;
  created_at: string;
  updated_at: string;
}

export interface HardwareComponent {
  id: string;
  server_id: string;
  type: HardwareType;
  model?: string;
  manufacturer?: string;
  serial?: string;
  specs?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  server?: { id: string; code: string; name: string; environment: Environment };
}

export interface NetworkConfig {
  id: string;
  server_id: string;
  interface?: string;
  private_ip?: string;
  public_ip?: string;
  nat_ip?: string;
  domain?: string;
  subnet?: string;
  gateway?: string;
  dns: string[];
  created_at: string;
  updated_at: string;
  server?: { id: string; code: string; name: string; environment: Environment };
}

export interface ServerDetail extends Server {
  hardware_components: HardwareComponent[];
  network_configs: NetworkConfig[];
  app_deployments: {
    id: string;
    environment: Environment;
    version: string;
    status: string;
    title?: string;
    deployed_at?: string;
    application: { id: string; code: string; name: string };
  }[];
}
