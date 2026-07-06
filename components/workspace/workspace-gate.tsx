'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/workspace-context';
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton';
import { AppContentSkeleton } from '@/components/layout/app-content-skeleton';

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

  const showDashboardSkeleton = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  if (loading) {
    return showDashboardSkeleton ? <DashboardPageSkeleton /> : <AppContentSkeleton />;
  }

  if (needsWorkspace) {
    return showDashboardSkeleton ? <DashboardPageSkeleton /> : <AppContentSkeleton />;
  }

  return <>{children}</>;
}
