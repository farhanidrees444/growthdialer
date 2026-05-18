export interface TelnyxCountry {
  code: string;
  name: string;
  flag: string;
  price: number;
  types: Array<'local' | 'toll_free' | 'mobile' | 'national'>;
  popular?: boolean;
  supportsAreaCode?: boolean;
}

export const TELNYX_COUNTRIES: TelnyxCountry[] = [
  // Popular
  { code: 'US', name: 'United States', flag: '🇺🇸', price: 1.00, types: ['local', 'toll_free', 'national'], popular: true, supportsAreaCode: true },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', price: 1.00, types: ['local', 'toll_free'], popular: true, supportsAreaCode: true },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', price: 1.50, types: ['local', 'mobile', 'toll_free', 'national'], popular: true },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', price: 2.00, types: ['local', 'mobile', 'toll_free'], popular: true },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', price: 1.50, types: ['local', 'mobile', 'national'], popular: true },
  { code: 'FR', name: 'France', flag: '🇫🇷', price: 1.50, types: ['local', 'mobile', 'national'], popular: true },
  // More
  { code: 'ES', name: 'Spain', flag: '🇪🇸', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', price: 2.00, types: ['local', 'mobile', 'toll_free'] },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', price: 3.00, types: ['local', 'national'] },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', price: 3.00, types: ['local', 'mobile'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', price: 3.00, types: ['local', 'mobile'] },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', price: 3.00, types: ['local', 'mobile'] },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', price: 1.50, types: ['local', 'mobile'] },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', price: 2.00, types: ['local', 'mobile', 'national'] },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', price: 2.00, types: ['local', 'mobile', 'national'] },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', price: 1.50, types: ['local', 'mobile'] },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', price: 1.50, types: ['local', 'mobile'] },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', price: 1.50, types: ['local', 'mobile'] },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', price: 2.00, types: ['local', 'mobile'] },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', price: 2.00, types: ['local', 'mobile'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', price: 2.00, types: ['local', 'mobile'] },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', price: 2.00, types: ['local', 'mobile'] },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', price: 3.00, types: ['local', 'mobile'] },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', price: 3.00, types: ['local', 'mobile'] },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', price: 3.00, types: ['local', 'mobile'] },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', price: 3.00, types: ['local', 'mobile'] },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', price: 3.00, types: ['local', 'mobile'] },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', price: 3.00, types: ['local', 'mobile'] },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', price: 4.00, types: ['local', 'mobile'] },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', price: 4.00, types: ['local', 'mobile'] },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', price: 2.00, types: ['local', 'mobile'] },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', price: 2.00, types: ['local', 'mobile'] },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', price: 3.00, types: ['local', 'mobile'] },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', price: 3.00, types: ['local', 'mobile'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', price: 4.00, types: ['local', 'mobile'] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', price: 5.00, types: ['local', 'mobile'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', price: 4.00, types: ['local', 'mobile'] },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', price: 2.00, types: ['local', 'mobile'] },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', price: 2.00, types: ['local', 'mobile'] },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', price: 4.00, types: ['local', 'mobile'] },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', price: 4.00, types: ['local', 'mobile'] },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', price: 1.50, types: ['local', 'mobile', 'national'] },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', price: 1.50, types: ['local', 'mobile'] },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', price: 1.50, types: ['local', 'mobile'] },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', price: 2.00, types: ['local', 'mobile'] },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', price: 2.00, types: ['local', 'mobile'] },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', price: 1.50, types: ['local', 'mobile'] },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', price: 1.50, types: ['local', 'mobile'] },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', price: 1.50, types: ['local', 'mobile'] },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', price: 2.00, types: ['local', 'mobile'] },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', price: 2.00, types: ['local', 'mobile'] },
];

export const POPULAR_COUNTRIES = TELNYX_COUNTRIES.filter((c) => c.popular);
export const ALL_COUNTRIES = TELNYX_COUNTRIES;

export function getCountryByCode(code: string): TelnyxCountry | undefined {
  return TELNYX_COUNTRIES.find((c) => c.code === code);
}

export const NUMBER_TYPE_LABELS: Record<string, string> = {
  local: 'Local',
  toll_free: 'Toll-Free',
  mobile: 'Mobile',
  national: 'National',
};
