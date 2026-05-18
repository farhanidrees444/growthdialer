export interface TelnyxCountry {
  code: string;
  name: string;
  flag: string;
  price: number;
  types: Array<'local' | 'toll_free' | 'mobile' | 'national'>;
  popular?: boolean;
  supportsAreaCode?: boolean;
  is_live: boolean;
  region: 'North America' | 'Europe' | 'Asia Pacific' | 'Latin America' | 'Africa & Middle East';
}

export const TELNYX_COUNTRIES: TelnyxCountry[] = [
  // ── North America ──────────────────────────────────────────────────────────
  { code: 'US', name: 'United States', flag: '🇺🇸', price: 1.00, types: ['local', 'toll_free', 'national'], popular: true, supportsAreaCode: true, is_live: true, region: 'North America' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', price: 1.00, types: ['local', 'toll_free'], popular: true, supportsAreaCode: true, is_live: true, region: 'North America' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', price: 1.50, types: ['local', 'mobile'], is_live: true, region: 'North America' },

  // ── Europe ─────────────────────────────────────────────────────────────────
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', price: 1.50, types: ['local', 'mobile', 'toll_free', 'national'], popular: true, is_live: true, region: 'Europe' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', price: 1.50, types: ['local', 'mobile', 'national'], popular: true, is_live: true, region: 'Europe' },
  { code: 'FR', name: 'France', flag: '🇫🇷', price: 1.50, types: ['local', 'mobile', 'national'], popular: true, is_live: true, region: 'Europe' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', price: 2.00, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', price: 2.00, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', price: 1.50, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', price: 1.50, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', price: 1.50, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', price: 1.50, types: ['local', 'mobile', 'national'], is_live: true, region: 'Europe' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', price: 1.50, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', price: 1.50, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', price: 1.50, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', price: 1.50, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', price: 1.50, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Europe' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Europe' },

  // ── Asia Pacific ───────────────────────────────────────────────────────────
  { code: 'AU', name: 'Australia', flag: '🇦🇺', price: 2.00, types: ['local', 'mobile', 'toll_free'], popular: true, is_live: true, region: 'Asia Pacific' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', price: 2.00, types: ['local', 'mobile', 'toll_free'], is_live: true, region: 'Asia Pacific' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', price: 3.00, types: ['local', 'national'], is_live: false, region: 'Asia Pacific' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', price: 3.00, types: ['local', 'mobile'], is_live: false, region: 'Asia Pacific' },
  { code: 'IN', name: 'India', flag: '🇮🇳', price: 3.00, types: ['local', 'mobile'], is_live: false, region: 'Asia Pacific' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', price: 3.00, types: ['local', 'mobile'], is_live: true, region: 'Asia Pacific' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', price: 3.00, types: ['local', 'mobile'], is_live: false, region: 'Asia Pacific' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', price: 3.00, types: ['local', 'mobile'], is_live: true, region: 'Asia Pacific' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', price: 3.00, types: ['local', 'mobile'], is_live: true, region: 'Asia Pacific' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', price: 3.00, types: ['local', 'mobile'], is_live: false, region: 'Asia Pacific' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', price: 3.00, types: ['local', 'mobile'], is_live: false, region: 'Asia Pacific' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', price: 4.00, types: ['local', 'mobile'], is_live: false, region: 'Asia Pacific' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', price: 4.00, types: ['local', 'mobile'], is_live: false, region: 'Asia Pacific' },

  // ── Latin America ──────────────────────────────────────────────────────────
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', price: 3.00, types: ['local', 'mobile'], is_live: false, region: 'Latin America' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Latin America' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Latin America' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', price: 3.00, types: ['local', 'mobile'], is_live: false, region: 'Latin America' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', price: 3.00, types: ['local', 'mobile'], is_live: false, region: 'Latin America' },

  // ── Africa & Middle East ───────────────────────────────────────────────────
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Africa & Middle East' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', price: 2.00, types: ['local', 'mobile'], is_live: true, region: 'Africa & Middle East' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', price: 4.00, types: ['local', 'mobile'], is_live: false, region: 'Africa & Middle East' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', price: 4.00, types: ['local', 'mobile'], is_live: false, region: 'Africa & Middle East' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', price: 4.00, types: ['local', 'mobile'], is_live: false, region: 'Africa & Middle East' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', price: 5.00, types: ['local', 'mobile'], is_live: false, region: 'Africa & Middle East' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', price: 4.00, types: ['local', 'mobile'], is_live: false, region: 'Africa & Middle East' },
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
