import { redirect } from 'next/navigation';

export default function InboundPage() {
  redirect('/settings?tab=calling');
}
