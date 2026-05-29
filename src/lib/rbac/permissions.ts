/**
 * The permission catalog. Every action that needs authorization should
 * reference one of these strings — never inline a string at the call site.
 * Roles bundle permissions; the resolver in `./resolver.ts` checks whether
 * a user's effective permission set contains the one being requested.
 */

export const ORG_PERMISSIONS = {
  // Settings
  SETTINGS_READ: "org.settings.read",
  SETTINGS_WRITE: "org.settings.write",
  ORG_DELETE: "org.delete",
  OWNERSHIP_TRANSFER: "org.ownership.transfer",

  // Members
  MEMBERS_READ: "org.members.read",
  MEMBERS_INVITE: "org.members.invite",
  MEMBERS_REMOVE: "org.members.remove",
  MEMBERS_ROLE: "org.members.role",

  // Roles
  ROLES_READ: "org.roles.read",
  ROLES_WRITE: "org.roles.write",

  // Packages
  PACKAGE_READ: "org.package.read",
  PACKAGE_PUBLISH: "org.package.publish",
  PACKAGE_YANK_OWN: "org.package.yank.own",
  PACKAGE_YANK_ANY: "org.package.yank.any",
  PACKAGE_TRANSFER: "org.package.transfer",
  PACKAGE_DELETE: "org.package.delete",

  // Billing (future)
  BILLING_READ: "org.billing.read",
  BILLING_WRITE: "org.billing.write",
} as const;

export type OrgPermission =
  (typeof ORG_PERMISSIONS)[keyof typeof ORG_PERMISSIONS];

/**
 * Permission catalog grouped for UI rendering. Each entry has a human
 * label and a one-line description so the role editor can stand on its
 * own without consulting external docs.
 */
export interface PermissionEntry {
  key: OrgPermission;
  label: string;
  description: string;
}

export interface PermissionGroup {
  title: string;
  description: string;
  permissions: PermissionEntry[];
}

export const ORG_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: "Settings",
    description: "Org profile, ownership, and destructive controls.",
    permissions: [
      {
        key: ORG_PERMISSIONS.SETTINGS_READ,
        label: "Read settings",
        description: "View the org's profile and billing summary.",
      },
      {
        key: ORG_PERMISSIONS.SETTINGS_WRITE,
        label: "Edit settings",
        description: "Change display name, description, homepage, avatar.",
      },
      {
        key: ORG_PERMISSIONS.OWNERSHIP_TRANSFER,
        label: "Transfer ownership",
        description: "Hand the org over to another member.",
      },
      {
        key: ORG_PERMISSIONS.ORG_DELETE,
        label: "Delete the org",
        description:
          "Permanently destroy the org (blocked while it owns Runes).",
      },
    ],
  },
  {
    title: "Members",
    description: "Who can join and what they can do.",
    permissions: [
      {
        key: ORG_PERMISSIONS.MEMBERS_READ,
        label: "Read members",
        description: "See the member roster and pending invitations.",
      },
      {
        key: ORG_PERMISSIONS.MEMBERS_INVITE,
        label: "Invite members",
        description: "Send invitations by email.",
      },
      {
        key: ORG_PERMISSIONS.MEMBERS_REMOVE,
        label: "Remove members",
        description: "Kick a member from the org.",
      },
      {
        key: ORG_PERMISSIONS.MEMBERS_ROLE,
        label: "Change member roles",
        description: "Reassign which role a member holds.",
      },
    ],
  },
  {
    title: "Roles",
    description: "Read or edit the role/permission catalog.",
    permissions: [
      {
        key: ORG_PERMISSIONS.ROLES_READ,
        label: "Read roles",
        description: "View the list of roles and their permissions.",
      },
      {
        key: ORG_PERMISSIONS.ROLES_WRITE,
        label: "Edit roles",
        description: "Create, edit, and delete custom roles.",
      },
    ],
  },
  {
    title: "Packages",
    description: "Publishing and managing the org's Runes.",
    permissions: [
      {
        key: ORG_PERMISSIONS.PACKAGE_READ,
        label: "Read private packages",
        description:
          "View and install private Runes owned by this org. Public Runes are visible to everyone regardless of this permission.",
      },
      {
        key: ORG_PERMISSIONS.PACKAGE_PUBLISH,
        label: "Publish",
        description: "Publish new versions under @org/*.",
      },
      {
        key: ORG_PERMISSIONS.PACKAGE_YANK_OWN,
        label: "Yank own publishes",
        description: "Yank versions this member originally published.",
      },
      {
        key: ORG_PERMISSIONS.PACKAGE_YANK_ANY,
        label: "Yank any publish",
        description: "Yank versions regardless of who published them.",
      },
      {
        key: ORG_PERMISSIONS.PACKAGE_TRANSFER,
        label: "Transfer packages",
        description: "Move a Rune in or out of the org's scope.",
      },
      {
        key: ORG_PERMISSIONS.PACKAGE_DELETE,
        label: "Delete packages",
        description: "Hard-delete a Rune (rare; usually yank instead).",
      },
    ],
  },
  {
    title: "Billing",
    description: "Read or edit subscription details (future).",
    permissions: [
      {
        key: ORG_PERMISSIONS.BILLING_READ,
        label: "Read billing",
        description: "View the org's plan, invoices, and payment method.",
      },
      {
        key: ORG_PERMISSIONS.BILLING_WRITE,
        label: "Manage billing",
        description: "Change plan, update payment method, view invoices.",
      },
    ],
  },
];

export const PLATFORM_PERMISSIONS = {
  // Users
  USERS_READ: "platform.users.read",
  USERS_SUSPEND: "platform.users.suspend",
  USERS_DELETE: "platform.users.delete",
  USERS_ROLE: "platform.users.role",

  // Runes
  RUNES_READ: "platform.runes.read",
  RUNES_YANK: "platform.runes.yank",
  RUNES_DELETE: "platform.runes.delete",
  RUNES_TRANSFER: "platform.runes.transfer",

  // Orgs
  ORGS_READ: "platform.orgs.read",
  ORGS_SUSPEND: "platform.orgs.suspend",
  ORGS_DELETE: "platform.orgs.delete",

  // Audit
  AUDIT_READ: "platform.audit.read",
} as const;

export type PlatformPermission =
  (typeof PLATFORM_PERMISSIONS)[keyof typeof PLATFORM_PERMISSIONS];

export type Permission = OrgPermission | PlatformPermission;

/** Owner gets every org permission. */
const OWNER_PERMS: OrgPermission[] = Object.values(ORG_PERMISSIONS);

/** Admin can do everything except destroy or transfer the org itself. */
const ADMIN_PERMS: OrgPermission[] = OWNER_PERMS.filter(
  (p) =>
    p !== ORG_PERMISSIONS.ORG_DELETE &&
    p !== ORG_PERMISSIONS.OWNERSHIP_TRANSFER &&
    p !== ORG_PERMISSIONS.BILLING_WRITE,
);

/** Member can read, publish, and yank what they themselves published. */
const MEMBER_PERMS: OrgPermission[] = [
  ORG_PERMISSIONS.SETTINGS_READ,
  ORG_PERMISSIONS.MEMBERS_READ,
  ORG_PERMISSIONS.ROLES_READ,
  ORG_PERMISSIONS.PACKAGE_READ,
  ORG_PERMISSIONS.PACKAGE_PUBLISH,
  ORG_PERMISSIONS.PACKAGE_YANK_OWN,
];

export interface SystemRoleSpec {
  key: string;
  name: string;
  description: string;
  permissions: OrgPermission[];
}

/** The three system roles seeded on first DB connect. */
export const SYSTEM_ORG_ROLES: SystemRoleSpec[] = [
  {
    key: "owner",
    name: "Owner",
    description:
      "Full control: transfer the org, delete it, manage every setting.",
    permissions: OWNER_PERMS,
  },
  {
    key: "admin",
    name: "Admin",
    description:
      "Manage members, roles, and packages. Cannot delete or transfer the org.",
    permissions: ADMIN_PERMS,
  },
  {
    key: "member",
    name: "Member",
    description: "Publish under the org scope and yank your own packages.",
    permissions: MEMBER_PERMS,
  },
];

/** Platform staff get every platform permission via their role. */
const PLATFORM_ALL: PlatformPermission[] = Object.values(PLATFORM_PERMISSIONS);

const PLATFORM_ADMIN: PlatformPermission[] = PLATFORM_ALL.filter(
  (p) =>
    p !== PLATFORM_PERMISSIONS.USERS_DELETE &&
    p !== PLATFORM_PERMISSIONS.RUNES_DELETE &&
    p !== PLATFORM_PERMISSIONS.ORGS_DELETE &&
    p !== PLATFORM_PERMISSIONS.USERS_ROLE,
);

export const PLATFORM_ROLE_PERMS: Record<
  "owner" | "admin",
  PlatformPermission[]
> = {
  owner: PLATFORM_ALL,
  admin: PLATFORM_ADMIN,
};

export function isOrgPermission(p: string): p is OrgPermission {
  return p.startsWith("org.");
}

export function isPlatformPermission(p: string): p is PlatformPermission {
  return p.startsWith("platform.");
}
