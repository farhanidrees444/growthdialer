import type { TelephonyProvider } from '@/lib/telephony/types';
import { telnyxTelephonyProvider } from '@/lib/telephony/telnyx/provider';

let activeProvider: TelephonyProvider = telnyxTelephonyProvider;

export function getTelephonyProvider(): TelephonyProvider {
  return activeProvider;
}

export function setTelephonyProvider(provider: TelephonyProvider): void {
  activeProvider = provider;
}

export * from '@/lib/telephony/types';
