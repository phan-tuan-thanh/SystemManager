export type EnvironmentType = 'DEV' | 'UAT' | 'PROD' | 'LIVE';

export interface EnvironmentConfig {
  id: string;
  code: string;
  label: string;
  type: EnvironmentType;
  color: string;
  sort_order: number;
  is_active: boolean;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentSelectOption {
  value: string;
  label: string;
  color: string;
  type: EnvironmentType;
}
