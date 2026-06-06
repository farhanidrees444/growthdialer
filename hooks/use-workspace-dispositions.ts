'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '@/contexts/workspace-context';
import { DEFAULT_DISPOSITIONS, type WorkspaceDispositionDef } from '@/lib/dispositions/defaults';

export function useWorkspaceDispositions() {
  const { currentWorkspace, apiFetch } = useWorkspace();
  const [dispositions, setDispositions] = useState<WorkspaceDispositionDef[]>(DEFAULT_DISPOSITIONS);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/workspaces/${currentWorkspace.id}/dispositions`);
      if (res.ok) {
        const data = await res.json() as { dispositions: WorkspaceDispositionDef[] };
        if (data.dispositions?.length) setDispositions(data.dispositions);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch, currentWorkspace?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { dispositions, loading, refresh };
}
