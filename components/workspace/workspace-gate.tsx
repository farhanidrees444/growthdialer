'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/workspace-context';

const ONBOARDING_PREFIXES = ['/workspace/setup'];

function isOnboardingPath(pathname: string) {
  return ONBOARDING_PREFIXES.some((p) => pathname.startsWith(p));
}

export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { workspaces, loading } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();

  const onOnboarding = isOnboardingPath(pathname);
  const needsWorkspace = !loading && workspaces.length === 0 && !onOnboarding;

  useEffect(() => {
    if (needsWorkspace) {
      router.replace('/workspace/setup');
    }
  }, [needsWorkspace, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" aria-label="Loading workspace" />
      </div>
    );
  }

  if (needsWorkspace) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-[40vh] gap-3 text-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-sm text-white/50">Setting up your workspace…</p>
      </div>
    );
  }

  return <>{children}</>;
}
