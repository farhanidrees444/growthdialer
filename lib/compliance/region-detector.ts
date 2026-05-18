// Two-party consent detection by US area code and EU country prefix

const CA_AREA_CODES = new Set([
  '209','213','310','323','408','415','510','530','559',
  '562','619','626','650','661','707','714','760','805',
  '818','831','858','909','916','925','949','951',
]);

const FL_AREA_CODES = new Set([
  '305','321','352','386','407','561','727','754','772',
  '786','813','850','863','904','941','954',
]);

const IL_AREA_CODES = new Set([
  '217','224','309','312','331','618','630','708','773',
  '779','815','847','872',
]);

const MA_AREA_CODES = new Set([
  '339','351','413','508','617','774','781','857','978',
]);

const WA_AREA_CODES = new Set(['206','253','360','425','509','564']);
const PA_AREA_CODES = new Set(['215','267','272','412','484','570','610','717','724','814','878']);
const MD_AREA_CODES = new Set(['240','301','410','443','667']);
const CT_AREA_CODES = new Set(['203','475','860','959']);
const OR_AREA_CODES = new Set(['458','503','541','971']);

// Map area code → state name + consent type
const US_TWO_PARTY_STATES: Record<string, string> = {};
for (const code of CA_AREA_CODES) US_TWO_PARTY_STATES[code] = 'California';
for (const code of FL_AREA_CODES) US_TWO_PARTY_STATES[code] = 'Florida';
for (const code of IL_AREA_CODES) US_TWO_PARTY_STATES[code] = 'Illinois';
for (const code of MA_AREA_CODES) US_TWO_PARTY_STATES[code] = 'Massachusetts';
for (const code of WA_AREA_CODES) US_TWO_PARTY_STATES[code] = 'Washington';
for (const code of PA_AREA_CODES) US_TWO_PARTY_STATES[code] = 'Pennsylvania';
for (const code of MD_AREA_CODES) US_TWO_PARTY_STATES[code] = 'Maryland';
for (const code of CT_AREA_CODES) US_TWO_PARTY_STATES[code] = 'Connecticut';
for (const code of OR_AREA_CODES) US_TWO_PARTY_STATES[code] = 'Oregon';

// EU / international two-party prefixes
const RESTRICTED_COUNTRY_PREFIXES: Record<string, string> = {
  '+49': 'Germany',
  '+33': 'France',
  '+34': 'Spain',
  '+39': 'Italy',
  '+31': 'Netherlands',
  '+46': 'Sweden',
  '+44': 'United Kingdom',
  '+353': 'Ireland',
  '+45': 'Denmark',
  '+358': 'Finland',
  '+43': 'Austria',
  '+32': 'Belgium',
  '+351': 'Portugal',
};

export interface ConsentCheck {
  required: boolean;
  region: string;
  reason: string;
  disclaimer: string;
}

export function checkConsentRequired(phoneE164: string): ConsentCheck {
  if (!phoneE164) return { required: false, region: '', reason: '', disclaimer: '' };

  // US number (+1 followed by 10 digits)
  if (phoneE164.startsWith('+1') && phoneE164.length === 12) {
    const areaCode = phoneE164.slice(2, 5);
    const state = US_TWO_PARTY_STATES[areaCode];
    if (state) {
      return {
        required: true,
        region: state,
        reason: `${state} requires two-party consent to record calls`,
        disclaimer: `You are calling a ${state} number. ${state} law requires all parties to consent to recording. A disclaimer will be played automatically.`,
      };
    }
  }

  // International number — check EU prefixes (longest match first)
  const sorted = Object.keys(RESTRICTED_COUNTRY_PREFIXES).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (phoneE164.startsWith(prefix)) {
      const country = RESTRICTED_COUNTRY_PREFIXES[prefix];
      return {
        required: true,
        region: country,
        reason: `${country} requires consent to record under GDPR`,
        disclaimer: `You are calling ${country}. GDPR requires explicit consent before recording. A disclaimer will be played automatically.`,
      };
    }
  }

  return { required: false, region: '', reason: '', disclaimer: '' };
}
