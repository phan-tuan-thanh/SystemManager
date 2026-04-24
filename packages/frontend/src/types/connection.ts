export type ConnectionType = 'HTTP' | 'HTTPS' | 'TCP' | 'GRPC' | 'AMQP' | 'KAFKA' | 'DATABASE';
export type Environment = 'DEV' | 'UAT' | 'PROD';

export interface AppRef {
  id: string;
  code: string;
  name: string;
  group?: { id: string; name: string };
}

export interface AppConnection {
  id: string;
  source_app_id: string;
  target_app_id: string;
  environment: Environment;
  connection_type: ConnectionType;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  source_app?: AppRef;
  target_app?: AppRef;
}

export interface DependencyItem {
  connection_id: string;
  environment: Environment;
  connection_type: ConnectionType;
  description: string | null;
  app: AppRef;
}

export interface AppDependencies {
  application_id: string;
  upstream: DependencyItem[];
  downstream: DependencyItem[];
}

export interface ConnectionFilter {
  page?: number;
  limit?: number;
  search?: string;
  environment?: Environment;
  source_app_id?: string;
  target_app_id?: string;
  connection_type?: ConnectionType;
}
