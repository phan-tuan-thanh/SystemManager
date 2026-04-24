import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ApiResponse } from '../types/auth';
import type { UserGroup, GroupMember } from '../types/user';

interface GroupListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

interface GroupListData {
  items: UserGroup[];
  total: number;
  page: number;
  limit: number;
}

export function useUserGroupList(params: GroupListParams = {}) {
  return useQuery<GroupListData>({
    queryKey: ['user-groups', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<UserGroup[]>>('/user-groups', { params });
      return {
        items: data.data,
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
      };
    },
  });
}

export function useUserGroupDetail(id: string) {
  return useQuery<UserGroup>({
    queryKey: ['user-groups', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<UserGroup>>(`/user-groups/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateUserGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { code: string; name: string; description?: string; default_role: string }) => {
      const { data } = await apiClient.post<ApiResponse<UserGroup>>('/user-groups', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-groups'] }),
  });
}

export function useUpdateUserGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; description?: string; default_role?: string; status?: string }) => {
      const { data } = await apiClient.patch<ApiResponse<UserGroup>>(`/user-groups/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-groups'] }),
  });
}

export function useDeleteUserGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/user-groups/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-groups'] }),
  });
}

export function useGroupMembers(groupId: string, enabled = false) {
  return useQuery<GroupMember[]>({
    queryKey: ['user-groups', groupId, 'members'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<GroupMember[]>>(`/user-groups/${groupId}/members`);
      return data.data;
    },
    enabled,
  });
}

export function useAddGroupMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: string; userIds: string[] }) => {
      await apiClient.post(`/user-groups/${groupId}/members`, { user_ids: userIds });
    },
    onSuccess: (_, { groupId }) => qc.invalidateQueries({ queryKey: ['user-groups', groupId, 'members'] }),
  });
}

export function useRemoveGroupMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: string; userIds: string[] }) => {
      await apiClient.delete(`/user-groups/${groupId}/members`, { data: { user_ids: userIds } });
    },
    onSuccess: (_, { groupId }) => qc.invalidateQueries({ queryKey: ['user-groups', groupId, 'members'] }),
  });
}
