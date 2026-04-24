export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  user_agent: string | null;
  result: 'SUCCESS' | 'FAILED';
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export interface AuditLogFilter {
  page?: number;
  limit?: number;
  action?: string;
  resource_type?: string;
  user_id?: string;
  from?: string;
  to?: string;
}
