import type { FirewallEnvironment, NetworkZone } from './network-zone';

export type FirewallAction = 'ALLOW' | 'DENY';
export type FirewallRuleStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';

export interface FirewallRuleServer {
  id: string;
  code: string;
  name: string;
  environment: FirewallEnvironment;
}

export interface FirewallRulePort {
  id: string;
  port_number: number;
  protocol: string;
  service_name?: string;
}

export interface FirewallRule {
  id: string;
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
  created_at: string;
  updated_at: string;
  source_zone?: Pick<NetworkZone, 'id' | 'name' | 'code' | 'color'>;
  destination_zone?: Pick<NetworkZone, 'id' | 'name' | 'code' | 'color'>;
  destination_server?: FirewallRuleServer;
  destination_port?: FirewallRulePort;
}

export interface FirewallRuleMeta {
  total: number;
  page: number;
  limit: number;
}

export interface FirewallRuleListResponse {
  data: FirewallRule[];
  meta: FirewallRuleMeta;
}
