import type { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { NotFoundContent } from '@/components/marketing/NotFoundContent';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you requested does not exist. Return to GrowthDialer home or start free.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <MarketingShell>
      <NotFoundContent />
    </MarketingShell>
  );
}
