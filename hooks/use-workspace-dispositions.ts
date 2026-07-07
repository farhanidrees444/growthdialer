'use client';

import { DEFAULT_DISPOSITIONS, type WorkspaceDispositionDef } from '@/lib/dispositions/defaults';

/** User-scoped dispositions — workspace custom dispositions removed. */
export function useWorkspaceDispositions() {
  const dispositions: WorkspaceDispositionDef[] = DEFAULT_DISPOSITIONS;

  return {
    dispositions,
    loading: false,
    refresh: async () => undefined,
  };
}
