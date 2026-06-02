"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Mail, Shield, MoreHorizontal,
  CheckCircle2, XCircle, Loader2, Clock, Search,
  ChevronDown, Ban, Trash2, Crown, Building2,
  Zap, ExternalLink, X, AlertTriangle,
} from "lucide-react";
import { useWorkspace, type WorkspaceMember } from "@/contexts/workspace-context";
import { useSupabaseSession } from "@/lib/supabase/hooks";
import {
  ROLE_LABELS, ROLE_COLORS, hasPermission,
  type Role, type Permission,
} from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

// ── Role selector data ───────────────────────────────────────────────────────

const ROLES_LIST: { value: Role; label: string; description: string }[] = [
  { value: 'owner',   label: 'Owner',   description: 'Full access. Billing, delete workspace.' },
  { value: 'admin',   label: 'Admin',   description: 'Manage members, settings, and all data.' },
  { value: 'manager', label: 'Manager', description: 'Coach calls, assign leads, view team analytics.' },
  { value: 'agent',   label: 'Agent',   description: 'Make calls, manage own leads & recordings.' },
  { value: 'viewer',  label: 'Viewer',  description: 'Read-only access to dashboards and reports.' },
];

interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  created_at: string;
  expires_at: string;
}

// ── Invite Member Modal ──────────────────────────────────────────────────────

function InviteModal({
  open,
  onClose,
  onInvite,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: Role, message?: string) => Promise<void>;
  busy: boolean;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('agent');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) { setEmail(''); setRole(', 'agent'); setMessage(''); setError(''); }
  }, [open]);

  async function handleSubmit() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Valid email address is required');
      return;
    }
    setError('');
    await onInvite(email.trim(), role, message.trim() || undefined);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[oklch(0.086_0.024_282)] p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <UserPlus className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Invite team member</h2>
              <p className="text-xs text-slate-500">They'll receive an email invitation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="colleague@company.com"
            className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40 transition"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        {/* Role selector */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Role</label>
          <div className="grid grid-cols-1 gap-2">
            {ROLES_LIST.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-all",
                  role === r.value
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]",
                )}
              >
                <div>
                  <span className="text-sm font-semibold text-white">{r.label}</span>
                  <p className="text-[11px] text-slate-500">{r.description}</p>
                </div>
                {role === r.value && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Optional message */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">
            Personal message <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hey! Join our GrowthDialer workspace — we're crushing it! 🚀"
            rows={2}
            className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none resize-none focus:border-emerald-500/40 transition"
          />
        </div>

        {error && (
          <p className="mb-3 text-xs text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            {error}
          </p>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={busy || !email.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-xl disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #059669, hsl(262,80%,50%))'' }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {busy ? 'Sending invitation…' : 'Send invitation'}
        </Button>
      </motion.div>
    </div>
  );
}

// ── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant,
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | ', 'default';
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  if (!open) return null;

  const isDanger = confirmVariant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[oklch(0.086_0.024_282)] p-6 shadow-2xl"
      >
        <div className={cn(
          "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full",
          isDanger ? "bg-red-500/10" : "bg-amber-500/10",
        )}>
          {isDanger
            ? <Trash2 className="h-5 w-5 text-red-400" />
            : <AlertTriangle className="h-5 w-5 text-amber-400" />
          }
        </div>
        <h3 className="mb-1 text-center text-base font-bold text-white">{title}</h3>
        <p className="mb-5 text-center text-sm text-slate-400">{message}</p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-white/[0.10] bg-white/[0.04] text-sm font-medium text-white hover:bg-white/[0.07]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "flex-1 text-sm font-bold text-white",
              isDanger ? "bg-red-600 hover:bg-red-500" : "",
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const session = useSupabaseSession();
  const {
    currentWorkspace, currentRole, currentMemberId,
    members, loading, membersLoading,
    inviteMember, removeMember, updateMemberRole, refreshMembers, can,
  } = useWorkspace();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Confirm dialogs
  const [confirmRemove, setConfirmRemove] = useState<WorkspaceMember | null>(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState<{ member: WorkspaceMember; role: Role } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const canInvite = can('INVITE_MEMBERS');
  const canRemove = can('REMOVE_MEMBERS');
  const canChangeRoles = can('CHANGE_ROLES');

  // Fetch pending invites
  const fetchPendingInvites = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setPendingInvites(data.pending_invitations ?? []);
      }
    } catch { /* silent */ }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchPendingInvites();
  }, [fetchPendingInvites]);

  async function handleInvite(email: string, role: Role, message?: string) {
    if (!currentWorkspace) return;
    setInviteBusy(true);
    const result = await inviteMember(email, role, message);
    setInviteBusy(false);
    if (result.ok) {
      setInviteOpen(false);
      fetchPendingInvites();
    }
  }

  async function handleRemove(member: WorkspaceMember) {
    setActionBusy(true);
    const result = await removeMember(member.user_id);
    setActionBusy(false);
    if (result.ok) {
      setConfirmRemove(null);
      fetchPendingInvites();
    }
  }

  async function handleRoleChange(member: WorkspaceMember, newRole: Role) {
    setActionBusy(true);
    const result = await updateMemberRole(member.user_id, newRole);
    setActionBusy(false);
    if (result.ok) {
      setConfirmRoleChange(null);
    }
  }

  const memberCount = members.filter((m) => m.status === 'active').length;
  const filtered = members.filter((m) =>
    !searchQuery || m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isOwner = currentRole === 'owner';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Workspace banner */}
        {currentWorkspace && (
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-emerald-600/10 via-transparent to-violet-600/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-brand glow-brand-sm">
                  <Building2 className="h-5 w-5 text-[oklch(0.08_0.04_153)]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">{currentWorkspace.name}</h2>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400">
                      {currentWorkspace.plan === 'enterprise' ? 'Enterprise' : `${currentWorkspace.plan?.charAt(0).toUpperCase()}${currentWorkspace.plan?.slice(1)}`} plan
                    </span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-400">
                      {memberCount}/{currentWorkspace.max_seats} seats used
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Seat bar */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="flex h-1.5 w-20 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, (memberCount / currentWorkspace.max_seats) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 tabular-nums">
                    {Math.round((memberCount / currentWorkspace.max_seats) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members…"
              className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40 transition"
            />
          </div>
          {canInvite && (
            <Button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-bold text-white shadow-xl"
              style={{ background: 'linear-gradient(135deg, #059669, hsl(262,80%,50%))'' }}
            >
              <UserPlus className="h-4 w-4" />
              Invite member
            </Button>
          )}
        </div>

        {/* Loading */}
        {(loading || membersLoading) && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="ml-3 text-sm text-slate-400">Loading team…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !membersLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/50">
              <Users className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="text-base font-semibold text-white">No team members found</h3>
            <p className="mt-1 text-sm text-slate-400">
              {searchQuery ? 'Try a different search term.' : 'Invite your first team member to get started.'}
            </p>
          </div>
        )}

        {/* Members list */}
        {!loading && !membersLoading && filtered.length > 0 && (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
              <div className="col-span-5">Member</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Last active</div>
              <div className="col-span-1" />
            </div>

            <AnimatePresence initial={false}>
              {filtered.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  currentMemberId={currentMemberId}
                  isOwner={isOwner}
                  canRemove={canRemove}
                  canChangeRoles={canChangeRoles}
                  onChangeRole={(role) => setConfirmRoleChange({ member, role })}
                  onRemove={() => setConfirmRemove(member)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pending invitations */}
        {pendingInvites.length > 0 && (
          <div className="pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending invitations ({pendingInvites.length})
            </h3>
            <div className="space-y-2">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                    <Mail className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{inv.email}</p>
                    <p className="text-xs text-slate-500">
                      Invited as {ROLE_LABELS[inv.role]} · Expires{" "}
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-semibold">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {inviteOpen && (
          <InviteModal
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            onInvite={handleInvite}
            busy={inviteBusy}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remove member"
        message={`Are you sure you want to remove ${confirmRemove?.full_name || confirmRemove?.email || 'this member'}? They', 'll lose access to this workspace.`}
        confirmLabel="Remove"
        confirmVariant="danger"
        busy={actionBusy}
        onConfirm={() => confirmRemove && handleRemove(confirmRemove)}
        onCancel={() => setConfirmRemove(null)}
      />

      <ConfirmDialog
        open={!!confirmRoleChange}
        title="Change role"
        message={`Change ${confirmRoleChange?.member.full_name || confirmRoleChange?.member.email || 'this member'}', 's role to ${confirmRoleChange?.role ? ROLE_LABELS[confirmRoleChange.role] : ''}?`}
        confirmLabel="Change role"
        busy={actionBusy}
        onConfirm={() => confirmRoleChange && handleRoleChange(confirmRoleChange.member, confirmRoleChange.role)}
        onCancel={() => setConfirmRoleChange(null)}
      />
    </div>
  );
}

// ── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  currentMemberId,
  isOwner,
  canRemove,
  canChangeRoles,
  onChangeRole,
  onRemove,
}: {
  member: WorkspaceMember;
  currentMemberId: string | null;
  isOwner: boolean;
  canRemove: boolean;
  canChangeRoles: boolean;
  onChangeRole: (role: Role) => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isSelf = member.id === currentMemberId;
  const isOwnerMember = member.role === 'owner';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:border-white/[0.10] hover:bg-white/[0.04] transition-all"
    >
      {/* Avatar + name */}
      <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
          isOwnerMember
            ? "bg-amber-500/10 text-amber-400"
            : "bg-emerald-500/10 text-emerald-400",
        )}>
          {initials(member.full_name || member.email)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-white truncate">
              {member.full_name || member.email?.split('@')[0] || ', 'Unknown'}
            </p>
            {isOwnerMember && (
              <Crown className="h-3 w-3 shrink-0 text-amber-400" />
            )}
            {isSelf && (
              <Badge className="bg-white/[0.06] text-slate-400 border-white/[0.08] text-[9px] font-semibold px-1.5 py-0">
                YOU
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">{member.email || ''}</p>
        </div>
      </div>

      {/* Role (desktop) */}
      <div className="hidden sm:block sm:col-span-2">
        <RoleBadge role={member.role} />
      </div>

      {/* Status (desktop) */}
      <div className="hidden sm:block sm:col-span-2">
        <StatusBadge status={member.status} />
      </div>

      {/* Last active (desktop) */}
      <div className="hidden sm:block sm:col-span-2">
        <span className="text-xs text-slate-500">
          {member.last_active_at
            ? timeAgo(member.last_active_at)
            : member.status === 'active'
              ? 'Just now'
              : '—'}
        </span>
      </div>

      {/* Actions (desktop) */}
      <div className="hidden sm:block sm:col-span-1 relative">
        {(canChangeRoles || canRemove) && !isOwnerMember && (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors ml-auto"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-white/[0.08] bg-[oklch(0.086_0.024_282)] p-1.5 shadow-2xl shadow-black/40">
                  {canChangeRoles && ROLES_LIST.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      disabled={r.value === member.role}
                      onClick={() => { setMenuOpen(false); onChangeRole(r.value); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Make {r.label}
                      {r.value === member.role && (
                        <CheckCircle2 className="h-3 w-3 ml-auto text-emerald-400" />
                      )}
                    </button>
                  ))}
                  {canRemove && (
                    <>
                      <div className="my-1 border-t border-white/[0.06]" />
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); onRemove(); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove from workspace
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Mobile compact info row */}
      <div className="sm:hidden flex items-center gap-3 text-xs text-slate-500">
        <RoleBadge role={member.role} />
        <StatusBadge status={member.status} />
        <span className="ml-auto">
          {member.last_active_at ? timeAgo(member.last_active_at) : '—'}
        </span>
      </div>

      {/* Mobile action buttons */}
      <div className="sm:hidden flex gap-2">
        {(canChangeRoles || canRemove) && !isOwnerMember && (
          <>
            <select
              value={member.role}
              onChange={(e) => onChangeRole(e.target.value as Role)}
              className="flex-1 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 outline-none"
            >
              {ROLES_LIST.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Helper components ────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border',
      ROLE_COLORS[role],
    )}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  if (status === 'invited') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-400">
        <Clock className="h-3 w-3" />
        Invited
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-400">
      <Ban className="h-3 w-3" />
      {status}
    </span>
  );
}

function initials(name: string | null | undefined) {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}