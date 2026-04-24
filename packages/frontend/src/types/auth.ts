export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    roles: string[];
  };
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}
