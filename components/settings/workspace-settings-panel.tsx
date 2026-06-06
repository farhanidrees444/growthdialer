'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export function WorkspaceSettingsPanel() {
  const router = useRouter();
  const {
    currentWorkspace,
    currentRole,
    can,
    apiFetch,
    refreshWorkspaces,
    setCurrentWorkspace,
    workspaces,
  } = useWorkspace();

  const [name, setName] = useState(currentWorkspace?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  if (!currentWorkspace) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No workspace selected.
      </p>
    );
  }

  const workspace = currentWorkspace;

  const canEdit = can('WORKSPACE_EDIT');
  const canDelete = can('WORKSPACE_DELETE');

  async function saveName() {
    if (!name.trim() || name.trim() === workspace.name) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        toast.error('Could not update workspace name');
        return;
      }
      const data = await res.json() as { workspace: typeof workspace };
      await refreshWorkspaces();
      if (data.workspace) await setCurrentWorkspace(data.workspace);
      toast.success('Workspace updated');
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkspace() {
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        toast.error(data.error ?? 'Delete failed');
        return;
      }
      toast.success('Workspace deleted');
      await refreshWorkspaces();
      const remaining = workspaces.filter((w) => w.id !== workspace.id);
      if (remaining[0]) {
        await setCurrentWorkspace(remaining[0]);
        router.push('/dashboard');
      } else {
        router.push('/workspace/setup');
      }
    } finally {
      setDeleting(false);
      setConfirmName('');
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Workspace
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team&apos;s home base — name, plan, and danger zone.
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Plan</span>
          <Badge variant="secondary" className="capitalize">{workspace.plan}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Your role</span>
          <Badge variant="outline" className="capitalize">{currentRole}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Seats</span>
          <span className="text-sm text-white tabular-nums">{workspace.max_seats}</span>
        </div>

        <div className="pt-2 space-y-2">
          <label className="text-xs font-medium text-white/70">Workspace name</label>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              className="bg-white/[0.04] border-white/[0.08]"
            />
            <Button
              type="button"
              onClick={() => void saveName()}
              disabled={!canEdit || saving || name.trim() === workspace.name}
              className="shrink-0 gradient-brand text-white border-0"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {canDelete && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-red-300">Danger zone</h3>
            <p className="text-xs text-red-200/60 mt-1 leading-relaxed">
              Permanently delete this workspace, all leads, calls, and team data. This cannot be undone.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="destructive" className="gap-2" />}
            >
              <Trash2 className="h-4 w-4" />
              Delete workspace
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete &quot;{workspace.name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>
                  Type <strong>{workspace.name}</strong> to confirm. All members lose access immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={workspace.name}
                className="bg-white/[0.04]"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirmName !== workspace.name || deleting}
                  onClick={(e) => {
                    e.preventDefault();
                    void deleteWorkspace();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Deleting…' : 'Delete forever'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
