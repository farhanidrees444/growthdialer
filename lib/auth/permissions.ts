export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  VIEWER: 'viewer',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  agent: 'Agent',
  viewer: 'Viewer',
};

export const ROLE_COLORS: Record<Role, string> = {
  owner: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  admin: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  manager: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  agent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  viewer: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

// Role hierarchy — higher index = more permissions
const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  agent: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

export function roleAtLeast(role: string, minimum: Role): boolean {
  return (ROLE_RANK[role as Role] ?? -1) >= ROLE_RANK[minimum];
}

export const PERMISSIONS = {
  // Workspace
  WORKSPACE_DELETE: ['owner'],
  WORKSPACE_EDIT: ['owner', 'admin'],

  // Members
  INVITE_MEMBERS: ['owner', 'admin'],
  REMOVE_MEMBERS: ['owner', 'admin'],
  CHANGE_ROLES: ['owner', 'admin'],

  // Billing
  MANAGE_BILLING: ['owner'],
  VIEW_BILLING: ['owner', 'admin'],

  // Calls
  MAKE_CALLS: ['owner', 'admin', 'manager', 'agent'],
  SEND_SMS: ['owner', 'admin', 'manager', 'agent'],
  COACH_CALLS: ['owner', 'admin', 'manager'],
  BARGE_CALLS: ['owner', 'admin', 'manager'],
  VIEW_ALL_CALLS: ['owner', 'admin', 'manager'],

  // Leads
  CREATE_LEADS: ['owner', 'admin', 'manager', 'agent'],
  EDIT_ALL_LEADS: ['owner', 'admin', 'manager'],
  EDIT_OWN_LEADS: ['owner', 'admin', 'manager', 'agent'],
  DELETE_LEADS: ['owner', 'admin'],
  ASSIGN_LEADS: ['owner', 'admin', 'manager'],

  // Recordings
  VIEW_ALL_RECORDINGS: ['owner', 'admin', 'manager'],
  VIEW_OWN_RECORDINGS: ['owner', 'admin', 'manager', 'agent'],
  DELETE_RECORDINGS: ['owner', 'admin'],

  // Analytics
  VIEW_TEAM_ANALYTICS: ['owner', 'admin', 'manager'],
  VIEW_OWN_ANALYTICS: ['owner', 'admin', 'manager', 'agent', 'viewer'],

  // Numbers
  BUY_NUMBERS: ['owner', 'admin'],
  ASSIGN_NUMBERS: ['owner', 'admin', 'manager'],

  // Teams
  MANAGE_TEAMS: ['owner', 'admin', 'manager'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission] as readonly string[];
  return allowed.includes(role);
}

/** Whether caller may assign targetRole to another member (invite or PATCH). */
export function canAssignRole(callerRole: string, targetRole: Role): boolean {
  const caller = callerRole as Role;
  if (!(caller in ROLE_RANK) || !(targetRole in ROLE_RANK)) return false;
  if (targetRole === 'owner') return false;
  return ROLE_RANK[targetRole] <= ROLE_RANK[caller];
}

export function requirePermission(role: string, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    const allowed = PERMISSIONS[permission] as readonly string[];
    throw new Error(
      `Permission denied: '${permission}' requires one of: ${allowed.join(', ')}. Current role: ${role}`,
    );
  }
}

// Server-side helper — throws 403 response if check fails
export function checkPermission(role: string | null | undefined, permission: Permission): void {
  if (!role || !hasPermission(role, permission)) {
    throw new Error(`Forbidden: insufficient permissions`);
  }
}
