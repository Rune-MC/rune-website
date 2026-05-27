import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export const orgKeys = {
  all: ["orgs"] as const,
  list: () => [...orgKeys.all, "list"] as const,
  detail: (name: string) => [...orgKeys.all, "detail", name] as const,
  members: (name: string) => [...orgKeys.all, name, "members"] as const,
  roles: (name: string) => [...orgKeys.all, name, "roles"] as const,
};

export interface OrgSummary {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  avatar_url: string | null;
  role: string;
  is_owner: boolean;
}

export function useMyOrgsQuery() {
  return useQuery({
    queryKey: orgKeys.list(),
    queryFn: () => apiFetch<{ orgs: OrgSummary[] }>("/api/v1/orgs"),
  });
}

export interface CreateOrgInput {
  name: string;
  displayName?: string;
  description?: string;
}

export function useCreateOrgMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrgInput) =>
      apiFetch<{ id: string; name: string; display_name: string }>(
        "/api/v1/orgs",
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.list() });
    },
  });
}

export interface OrgMember {
  user_id: string;
  username: string | null;
  github_login: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role_key: string | null;
  role_name: string | null;
  is_owner: boolean;
  joined_at: string | null;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role_key: string | null;
  invited_at: string | null;
  expires_at: string;
}

export function useOrgMembersQuery(name: string) {
  return useQuery({
    queryKey: orgKeys.members(name),
    queryFn: () =>
      apiFetch<{
        members: OrgMember[];
        pending_invitations: PendingInvitation[];
      }>(`/api/v1/orgs/${encodeURIComponent(name)}/members`),
    enabled: Boolean(name),
  });
}

export function useInviteMemberMutation(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; roleKey: string }) =>
      apiFetch(`/api/v1/orgs/${encodeURIComponent(name)}/members`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.members(name) });
    },
  });
}

export function useRemoveMemberMutation(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/api/v1/orgs/${encodeURIComponent(name)}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.members(name) });
    },
  });
}

export function useChangeMemberRoleMutation(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleKey }: { userId: string; roleKey: string }) =>
      apiFetch(`/api/v1/orgs/${encodeURIComponent(name)}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ roleKey }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.members(name) });
    },
  });
}

export interface RoleSummary {
  id: string;
  key: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
}

export function useOrgRolesQuery(name: string) {
  return useQuery({
    queryKey: orgKeys.roles(name),
    queryFn: () =>
      apiFetch<{ roles: RoleSummary[] }>(
        `/api/v1/orgs/${encodeURIComponent(name)}/roles`,
      ),
    enabled: Boolean(name),
  });
}

export interface CreateRoleInput {
  key: string;
  name: string;
  description?: string;
  permissions: string[];
}

export function useCreateRoleMutation(orgName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) =>
      apiFetch<{
        id: string;
        key: string;
        name: string;
        permissions: string[];
      }>(`/api/v1/orgs/${encodeURIComponent(orgName)}/roles`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.roles(orgName) });
    },
  });
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

export function useUpdateRoleMutation(orgName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      input,
    }: {
      roleId: string;
      input: UpdateRoleInput;
    }) =>
      apiFetch(`/api/v1/orgs/${encodeURIComponent(orgName)}/roles/${roleId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.roles(orgName) });
    },
  });
}

export function useDeleteRoleMutation(orgName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) =>
      apiFetch(`/api/v1/orgs/${encodeURIComponent(orgName)}/roles/${roleId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.roles(orgName) });
    },
  });
}

export function useUpdateOrgMutation(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      displayName?: string;
      description?: string | null;
      homepage?: string | null;
    }) =>
      apiFetch<{ id: string; name: string }>(
        `/api/v1/orgs/${encodeURIComponent(name)}`,
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.detail(name) });
      qc.invalidateQueries({ queryKey: orgKeys.list() });
    },
  });
}

export function useDeleteOrgMutation(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/v1/orgs/${encodeURIComponent(name)}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.list() });
    },
  });
}
