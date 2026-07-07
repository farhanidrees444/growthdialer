'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Workspace setup removed — send users to the dashboard. */
export default function WorkspaceSetupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}
