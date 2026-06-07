import { redirect } from 'next/navigation';

export default function LegacyIntegrationsFeatureRedirect() {
  redirect('/integrations');
}
