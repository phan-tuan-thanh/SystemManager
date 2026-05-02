export type NetworkZoneType =
  | 'LOCAL'
  | 'DMZ'
  | 'DB'
  | 'DEV'
  | 'UAT'
  | 'PROD'
  | 'INTERNET'
  | 'MANAGEMENT'
  | 'STORAGE'
  | 'BACKUP'
  | 'CUSTOM';

export type FirewallEnvironment = 'DEV' | 'UAT' | 'PROD';

export interface ZoneIpEntry {
  id: string;
  zone_id: string;
  ip_address: string;
  label?: string;
  description?: string;
  is_range: boolean;
  created_at: string;
  updated_at: string;
}

export interface NetworkZone {
  id: string;
  name: string;
  code: string;
  zone_type: NetworkZoneType;
  description?: string;
  color?: string;
  environment: FirewallEnvironment;
  created_at: string;
  updated_at: string;
  ip_count?: number;
  ip_entries?: ZoneIpEntry[];
}

export interface NetworkZoneMeta {
  total: number;
  page: number;
  limit: number;
}

export interface NetworkZoneListResponse {
  data: NetworkZone[];
  meta: NetworkZoneMeta;
}

export interface NetworkZoneDetailResponse {
  data: NetworkZone;
}

export interface ZoneIpListResponse {
  data: ZoneIpEntry[];
}
