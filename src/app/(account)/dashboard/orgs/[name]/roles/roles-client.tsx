"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  type RoleSummary,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useOrgRolesQuery,
  useUpdateRoleMutation,
} from "@/lib/query/orgs";
import { ORG_PERMISSION_GROUPS } from "@/lib/rbac/permissions";

interface Props {
  orgName: string;
}

type Editing = { mode: "create" } | { mode: "edit"; role: RoleSummary } | null;

export function RolesClient({ orgName }: Props) {
  const { data, isLoading } = useOrgRolesQuery(orgName);
  const [editing, setEditing] = useState<Editing>(null);

  const sorted = useMemo(() => {
    const all = data?.roles ?? [];
    return [...all].sort((a, b) => {
      if (a.is_system !== b.is_system) return a.is_system ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [data?.roles]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-mono text-xs text-muted-foreground">roles</h2>
          {editing === null && (
            <button
              type="button"
              onClick={() => setEditing({ mode: "create" })}
              className="inline-flex items-center gap-1.5 rounded border border-border bg-foreground px-3 py-1.5 font-mono text-xs text-background transition-colors hover:bg-display"
            >
              <Plus className="size-3" aria-hidden="true" />
              new role
            </button>
          )}
        </div>
        <p className="mt-3 max-w-prose text-sm text-foreground">
          Roles bundle permissions. The three system roles (Owner, Admin,
          Member) ship with the platform and cannot be edited. Create custom
          roles for finer control — release manager, billing-only, read-only
          observer — and assign them to members from the{" "}
          <a
            href={`/dashboard/orgs/${orgName}/members`}
            className="text-primary transition-colors hover:text-primary-hover"
          >
            members page
          </a>
          .
        </p>
      </div>

      {editing?.mode === "create" && (
        <RoleEditor
          orgName={orgName}
          initial={{
            key: "",
            name: "",
            description: "",
            permissions: [],
          }}
          isNew
          onClose={() => setEditing(null)}
        />
      )}

      {isLoading ? (
        <p className="font-mono text-sm text-muted-foreground">loading...</p>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((r) => {
            const isOpen = editing?.mode === "edit" && editing.role.id === r.id;
            return (
              <li key={r.id} className="py-5">
                {isOpen ? (
                  <RoleEditor
                    orgName={orgName}
                    roleId={r.id}
                    initial={{
                      key: r.key,
                      name: r.name,
                      description: r.description ?? "",
                      permissions: r.permissions,
                    }}
                    onClose={() => setEditing(null)}
                  />
                ) : (
                  <RoleRow
                    role={r}
                    onEdit={() => setEditing({ mode: "edit", role: r })}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RoleRow({ role, onEdit }: { role: RoleSummary; onEdit: () => void }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm text-foreground">
            {role.name}{" "}
            <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {role.is_system ? "system" : "custom"}
            </span>
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {role.key}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {role.permissions.length} permission
            {role.permissions.length === 1 ? "" : "s"}
          </span>
          {!role.is_system && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${role.name}`}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-3" aria-hidden="true" />
              edit
            </button>
          )}
        </div>
      </div>
      {role.description && (
        <p className="mt-2 text-sm text-muted-foreground">{role.description}</p>
      )}
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {role.permissions.map((p) => (
          <li
            key={p}
            className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface EditorProps {
  orgName: string;
  roleId?: string;
  initial: {
    key: string;
    name: string;
    description: string;
    permissions: string[];
  };
  isNew?: boolean;
  onClose: () => void;
}

function RoleEditor({ orgName, roleId, initial, isNew, onClose }: EditorProps) {
  const [key, setKey] = useState(initial.key);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(initial.permissions),
  );
  const [error, setError] = useState<string | null>(null);

  const create = useCreateRoleMutation(orgName);
  const update = useUpdateRoleMutation(orgName);
  const del = useDeleteRoleMutation(orgName);

  const toggle = (perm: string) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const toggleGroup = (groupPerms: string[]) => {
    setPermissions((prev) => {
      const allSelected = groupPerms.every((p) => prev.has(p));
      const next = new Set(prev);
      if (allSelected) {
        for (const p of groupPerms) next.delete(p);
      } else {
        for (const p of groupPerms) next.add(p);
      }
      return next;
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const perms = Array.from(permissions);
    try {
      if (isNew) {
        await create.mutateAsync({
          key: key.trim().toLowerCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: perms,
        });
      } else if (roleId) {
        await update.mutateAsync({
          roleId,
          input: {
            name: name.trim(),
            description: description.trim(),
            permissions: perms,
          },
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  };

  const handleDelete = async () => {
    if (!roleId) return;
    if (
      !confirm(
        `Delete the role "${name}"? Members assigned to it must be reassigned first.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await del.mutateAsync(roleId);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <form
      onSubmit={save}
      className="rounded border border-border bg-muted px-5 py-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="block text-xs text-muted-foreground">
            Role key{" "}
            <span className="text-muted-foreground">(slug, lowercase)</span>
          </span>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
            disabled={!isNew}
            pattern="^[a-z0-9-]{2,48}$"
            placeholder="release-manager"
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground">
            Display name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={48}
            placeholder="Release Manager"
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="block text-xs text-muted-foreground">Description</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={240}
          placeholder="Publishes and yanks; no member management."
          className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      <div className="mt-6 space-y-5">
        <p className="font-mono text-xs text-muted-foreground">permissions</p>
        {ORG_PERMISSION_GROUPS.map((group) => {
          const groupKeys = group.permissions.map((p) => p.key);
          const allSelected = groupKeys.every((k) => permissions.has(k));
          const someSelected =
            !allSelected && groupKeys.some((k) => permissions.has(k));
          return (
            <fieldset
              key={group.title}
              className="rounded border border-border bg-background px-4 py-4"
            >
              <legend className="flex items-baseline gap-3 px-1">
                <span className="font-mono text-xs text-foreground">
                  {group.title}
                </span>
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKeys)}
                  className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {allSelected
                    ? "clear all"
                    : someSelected
                      ? "select all"
                      : "select all"}
                </button>
              </legend>
              <p className="mt-1 text-xs text-muted-foreground">
                {group.description}
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {group.permissions.map((perm) => {
                  const checked = permissions.has(perm.key);
                  return (
                    <li key={perm.key}>
                      <label className="flex cursor-pointer items-start gap-2.5 rounded px-2 py-1.5 transition-colors hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(perm.key)}
                          className="mt-0.5 size-3.5 shrink-0 accent-primary"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm text-foreground">
                            {perm.label}
                          </span>
                          <span className="block font-mono text-[11px] text-muted-foreground">
                            {perm.key}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {perm.description}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 font-mono text-xs text-destructive">{error}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded border border-border bg-foreground px-4 py-2 font-mono text-xs text-background transition-colors hover:bg-display disabled:opacity-50"
          >
            {saving ? "saving..." : isNew ? "create role" : "save changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            cancel
          </button>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={del.isPending}
            className="inline-flex items-center gap-1.5 rounded border border-destructive/40 px-3 py-1.5 font-mono text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="size-3" aria-hidden="true" />
            {del.isPending ? "deleting..." : "delete role"}
          </button>
        )}
      </div>
    </form>
  );
}
