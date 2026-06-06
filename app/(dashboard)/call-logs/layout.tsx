import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Call Logs',
  description:
    'Full call history for inbound and outbound calls — duration, disposition, recordings, and lead links in one place.',
};

export default function CallLogsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
