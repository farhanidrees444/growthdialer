'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { IntegrationsMarketplace } from '@/components/integrations/IntegrationsMarketplace';

export default function DashboardIntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsMarketplace />
    </Suspense>
  );
}
