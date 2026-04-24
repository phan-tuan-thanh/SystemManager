export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
export type Role = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface UserRole {
  role: Role;
  assigned_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  status: UserStatus;
  avatar_url: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export interface UserGroup {
  id: string;
  code: string;
  name: string;
  description: string | null;
  default_role: Role;
  status: string;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    status: UserStatus;
  };
  joined_at: string;
}

export interface ModuleConfig {
  module_key: string;
  display_name: string;
  module_type: 'CORE' | 'EXTENDED';
  status: 'ENABLED' | 'DISABLED';
  dependencies: string[];
}

export interface LoginHistory {
  id: string;
  created_at: string;
  revoked_at: string | null;
}
