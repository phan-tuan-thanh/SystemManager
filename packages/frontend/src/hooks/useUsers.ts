import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { User, LoginHistory } from '../types/user';

interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

interface UserListData {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

// Backend returns user_roles: [{role: string}] — normalize to roles: string[]
function normalizeUser(raw: Record<string, unknown>): User {
  const userRoles = (raw['user_roles'] as { role: string }[] | undefined) ?? [];
  return {
    ...(raw as unknown as User),
    roles: userRoles.map((r) => r.role),
  };
}

export function useUserList(params: UserListParams = {}) {
  return useQuery<UserListData>({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Record<string, unknown>[]>>('/users', { params });
      return {
        items: data.data.map(normalizeUser),
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useUserDetail(id: string) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/users/${id}`);
      return normalizeUser(data.data);
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { email: string; password: string; full_name: string }) => {
      const { data } = await apiClient.post<ApiResponse<User>>('/users', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; full_name?: string; status?: string; avatar_url?: string }) => {
      const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data } = await apiClient.post<ApiResponse<User>>(`/users/${id}/roles`, { role });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useRemoveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await apiClient.delete(`/users/${id}/roles/${role}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, new_password }: { id: string; new_password: string }) => {
      await apiClient.post(`/users/${id}/reset-password`, { new_password });
    },
  });
}

export function useLoginHistory(userId: string, enabled = false) {
  return useQuery<LoginHistory[]>({
    queryKey: ['users', userId, 'login-history'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<LoginHistory[]>>(`/users/${userId}/login-history`);
      return data.data;
    },
    enabled,
  });
}
