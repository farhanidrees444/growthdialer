/**
 * US area code → IANA timezone + state abbreviation.
 * Built-in map — no external API. Covers all ~320 active US area codes.
 * For TCPA compliance: "Unsafe" = local hour < 8 or >= 21 (8am–9pm rule).
 */

type AreaInfo = { tz: string; state: string };

const AREA_CODE_MAP: Record<string, AreaInfo> = {
  // ── EASTERN (America/New_York) ─────────────────────────────────────────────
  // Connecticut
  '203': { tz: 'America/New_York', state: 'CT' },
  '475': { tz: 'America/New_York', state: 'CT' },
  '860': { tz: 'America/New_York', state: 'CT' },
  '959': { tz: 'America/New_York', state: 'CT' },
  // Washington DC
  '202': { tz: 'America/New_York', state: 'DC' },
  // Delaware
  '302': { tz: 'America/New_York', state: 'DE' },
  // Florida (eastern)
  '239': { tz: 'America/New_York', state: 'FL' },
  '305': { tz: 'America/New_York', state: 'FL' },
  '321': { tz: 'America/New_York', state: 'FL' },
  '352': { tz: 'America/New_York', state: 'FL' },
  '386': { tz: 'America/New_York', state: 'FL' },
  '407': { tz: 'America/New_York', state: 'FL' },
  '561': { tz: 'America/New_York', state: 'FL' },
  '689': { tz: 'America/New_York', state: 'FL' },
  '727': { tz: 'America/New_York', state: 'FL' },
  '754': { tz: 'America/New_York', state: 'FL' },
  '772': { tz: 'America/New_York', state: 'FL' },
  '786': { tz: 'America/New_York', state: 'FL' },
  '813': { tz: 'America/New_York', state: 'FL' },
  '863': { tz: 'America/New_York', state: 'FL' },
  '904': { tz: 'America/New_York', state: 'FL' },
  '941': { tz: 'America/New_York', state: 'FL' },
  '954': { tz: 'America/New_York', state: 'FL' },
  // Georgia
  '229': { tz: 'America/New_York', state: 'GA' },
  '404': { tz: 'America/New_York', state: 'GA' },
  '470': { tz: 'America/New_York', state: 'GA' },
  '478': { tz: 'America/New_York', state: 'GA' },
  '678': { tz: 'America/New_York', state: 'GA' },
  '706': { tz: 'America/New_York', state: 'GA' },
  '762': { tz: 'America/New_York', state: 'GA' },
  '770': { tz: 'America/New_York', state: 'GA' },
  '912': { tz: 'America/New_York', state: 'GA' },
  // Indiana (mostly Eastern)
  '260': { tz: 'America/New_York', state: 'IN' },
  '317': { tz: 'America/New_York', state: 'IN' },
  '463': { tz: 'America/New_York', state: 'IN' },
  '574': { tz: 'America/New_York', state: 'IN' },
  '765': { tz: 'America/New_York', state: 'IN' },
  '812': { tz: 'America/New_York', state: 'IN' },
  '930': { tz: 'America/New_York', state: 'IN' },
  // Kentucky (eastern)
  '502': { tz: 'America/New_York', state: 'KY' },
  '606': { tz: 'America/New_York', state: 'KY' },
  '859': { tz: 'America/New_York', state: 'KY' },
  // Maine
  '207': { tz: 'America/New_York', state: 'ME' },
  // Maryland
  '240': { tz: 'America/New_York', state: 'MD' },
  '301': { tz: 'America/New_York', state: 'MD' },
  '410': { tz: 'America/New_York', state: 'MD' },
  '443': { tz: 'America/New_York', state: 'MD' },
  '667': { tz: 'America/New_York', state: 'MD' },
  // Massachusetts
  '339': { tz: 'America/New_York', state: 'MA' },
  '351': { tz: 'America/New_York', state: 'MA' },
  '413': { tz: 'America/New_York', state: 'MA' },
  '508': { tz: 'America/New_York', state: 'MA' },
  '617': { tz: 'America/New_York', state: 'MA' },
  '774': { tz: 'America/New_York', state: 'MA' },
  '781': { tz: 'America/New_York', state: 'MA' },
  '857': { tz: 'America/New_York', state: 'MA' },
  '978': { tz: 'America/New_York', state: 'MA' },
  // Michigan
  '231': { tz: 'America/New_York', state: 'MI' },
  '248': { tz: 'America/New_York', state: 'MI' },
  '269': { tz: 'America/New_York', state: 'MI' },
  '313': { tz: 'America/New_York', state: 'MI' },
  '517': { tz: 'America/New_York', state: 'MI' },
  '586': { tz: 'America/New_York', state: 'MI' },
  '616': { tz: 'America/New_York', state: 'MI' },
  '734': { tz: 'America/New_York', state: 'MI' },
  '810': { tz: 'America/New_York', state: 'MI' },
  '906': { tz: 'America/New_York', state: 'MI' },
  '947': { tz: 'America/New_York', state: 'MI' },
  '989': { tz: 'America/New_York', state: 'MI' },
  // New Hampshire
  '603': { tz: 'America/New_York', state: 'NH' },
  // New Jersey
  '201': { tz: 'America/New_York', state: 'NJ' },
  '551': { tz: 'America/New_York', state: 'NJ' },
  '609': { tz: 'America/New_York', state: 'NJ' },
  '732': { tz: 'America/New_York', state: 'NJ' },
  '848': { tz: 'America/New_York', state: 'NJ' },
  '856': { tz: 'America/New_York', state: 'NJ' },
  '862': { tz: 'America/New_York', state: 'NJ' },
  '908': { tz: 'America/New_York', state: 'NJ' },
  '973': { tz: 'America/New_York', state: 'NJ' },
  // New York
  '212': { tz: 'America/New_York', state: 'NY' },
  '315': { tz: 'America/New_York', state: 'NY' },
  '332': { tz: 'America/New_York', state: 'NY' },
  '347': { tz: 'America/New_York', state: 'NY' },
  '516': { tz: 'America/New_York', state: 'NY' },
  '518': { tz: 'America/New_York', state: 'NY' },
  '585': { tz: 'America/New_York', state: 'NY' },
  '607': { tz: 'America/New_York', state: 'NY' },
  '631': { tz: 'America/New_York', state: 'NY' },
  '646': { tz: 'America/New_York', state: 'NY' },
  '716': { tz: 'America/New_York', state: 'NY' },
  '718': { tz: 'America/New_York', state: 'NY' },
  '838': { tz: 'America/New_York', state: 'NY' },
  '845': { tz: 'America/New_York', state: 'NY' },
  '914': { tz: 'America/New_York', state: 'NY' },
  '917': { tz: 'America/New_York', state: 'NY' },
  '929': { tz: 'America/New_York', state: 'NY' },
  '934': { tz: 'America/New_York', state: 'NY' },
  // North Carolina
  '252': { tz: 'America/New_York', state: 'NC' },
  '336': { tz: 'America/New_York', state: 'NC' },
  '704': { tz: 'America/New_York', state: 'NC' },
  '743': { tz: 'America/New_York', state: 'NC' },
  '828': { tz: 'America/New_York', state: 'NC' },
  '910': { tz: 'America/New_York', state: 'NC' },
  '919': { tz: 'America/New_York', state: 'NC' },
  '980': { tz: 'America/New_York', state: 'NC' },
  '984': { tz: 'America/New_York', state: 'NC' },
  // Ohio
  '216': { tz: 'America/New_York', state: 'OH' },
  '220': { tz: 'America/New_York', state: 'OH' },
  '234': { tz: 'America/New_York', state: 'OH' },
  '330': { tz: 'America/New_York', state: 'OH' },
  '380': { tz: 'America/New_York', state: 'OH' },
  '419': { tz: 'America/New_York', state: 'OH' },
  '440': { tz: 'America/New_York', state: 'OH' },
  '513': { tz: 'America/New_York', state: 'OH' },
  '567': { tz: 'America/New_York', state: 'OH' },
  '614': { tz: 'America/New_York', state: 'OH' },
  '740': { tz: 'America/New_York', state: 'OH' },
  '937': { tz: 'America/New_York', state: 'OH' },
  // Pennsylvania
  '215': { tz: 'America/New_York', state: 'PA' },
  '223': { tz: 'America/New_York', state: 'PA' },
  '267': { tz: 'America/New_York', state: 'PA' },
  '272': { tz: 'America/New_York', state: 'PA' },
  '412': { tz: 'America/New_York', state: 'PA' },
  '445': { tz: 'America/New_York', state: 'PA' },
  '484': { tz: 'America/New_York', state: 'PA' },
  '570': { tz: 'America/New_York', state: 'PA' },
  '610': { tz: 'America/New_York', state: 'PA' },
  '717': { tz: 'America/New_York', state: 'PA' },
  '724': { tz: 'America/New_York', state: 'PA' },
  '814': { tz: 'America/New_York', state: 'PA' },
  '878': { tz: 'America/New_York', state: 'PA' },
  // Rhode Island
  '401': { tz: 'America/New_York', state: 'RI' },
  // South Carolina
  '803': { tz: 'America/New_York', state: 'SC' },
  '839': { tz: 'America/New_York', state: 'SC' },
  '843': { tz: 'America/New_York', state: 'SC' },
  '854': { tz: 'America/New_York', state: 'SC' },
  '864': { tz: 'America/New_York', state: 'SC' },
  // Tennessee (eastern)
  '423': { tz: 'America/New_York', state: 'TN' },
  '865': { tz: 'America/New_York', state: 'TN' },
  // Vermont
  '802': { tz: 'America/New_York', state: 'VT' },
  // Virginia
  '276': { tz: 'America/New_York', state: 'VA' },
  '434': { tz: 'America/New_York', state: 'VA' },
  '540': { tz: 'America/New_York', state: 'VA' },
  '571': { tz: 'America/New_York', state: 'VA' },
  '703': { tz: 'America/New_York', state: 'VA' },
  '757': { tz: 'America/New_York', state: 'VA' },
  '804': { tz: 'America/New_York', state: 'VA' },
  // West Virginia
  '304': { tz: 'America/New_York', state: 'WV' },
  '681': { tz: 'America/New_York', state: 'WV' },

  // ── CENTRAL (America/Chicago) ──────────────────────────────────────────────
  // Alabama
  '205': { tz: 'America/Chicago', state: 'AL' },
  '251': { tz: 'America/Chicago', state: 'AL' },
  '256': { tz: 'America/Chicago', state: 'AL' },
  '334': { tz: 'America/Chicago', state: 'AL' },
  '938': { tz: 'America/Chicago', state: 'AL' },
  // Arkansas
  '479': { tz: 'America/Chicago', state: 'AR' },
  '501': { tz: 'America/Chicago', state: 'AR' },
  '870': { tz: 'America/Chicago', state: 'AR' },
  // Florida (panhandle)
  '850': { tz: 'America/Chicago', state: 'FL' },
  // Illinois
  '217': { tz: 'America/Chicago', state: 'IL' },
  '224': { tz: 'America/Chicago', state: 'IL' },
  '309': { tz: 'America/Chicago', state: 'IL' },
  '312': { tz: 'America/Chicago', state: 'IL' },
  '331': { tz: 'America/Chicago', state: 'IL' },
  '447': { tz: 'America/Chicago', state: 'IL' },
  '464': { tz: 'America/Chicago', state: 'IL' },
  '618': { tz: 'America/Chicago', state: 'IL' },
  '630': { tz: 'America/Chicago', state: 'IL' },
  '708': { tz: 'America/Chicago', state: 'IL' },
  '773': { tz: 'America/Chicago', state: 'IL' },
  '779': { tz: 'America/Chicago', state: 'IL' },
  '815': { tz: 'America/Chicago', state: 'IL' },
  '847': { tz: 'America/Chicago', state: 'IL' },
  '872': { tz: 'America/Chicago', state: 'IL' },
  // Indiana (northwest near Chicago)
  '219': { tz: 'America/Chicago', state: 'IN' },
  // Iowa
  '319': { tz: 'America/Chicago', state: 'IA' },
  '515': { tz: 'America/Chicago', state: 'IA' },
  '563': { tz: 'America/Chicago', state: 'IA' },
  '641': { tz: 'America/Chicago', state: 'IA' },
  '712': { tz: 'America/Chicago', state: 'IA' },
  // Kansas
  '316': { tz: 'America/Chicago', state: 'KS' },
  '620': { tz: 'America/Chicago', state: 'KS' },
  '785': { tz: 'America/Chicago', state: 'KS' },
  '913': { tz: 'America/Chicago', state: 'KS' },
  // Kentucky (western)
  '270': { tz: 'America/Chicago', state: 'KY' },
  '364': { tz: 'America/Chicago', state: 'KY' },
  // Louisiana
  '225': { tz: 'America/Chicago', state: 'LA' },
  '318': { tz: 'America/Chicago', state: 'LA' },
  '337': { tz: 'America/Chicago', state: 'LA' },
  '504': { tz: 'America/Chicago', state: 'LA' },
  '985': { tz: 'America/Chicago', state: 'LA' },
  // Minnesota
  '218': { tz: 'America/Chicago', state: 'MN' },
  '320': { tz: 'America/Chicago', state: 'MN' },
  '507': { tz: 'America/Chicago', state: 'MN' },
  '612': { tz: 'America/Chicago', state: 'MN' },
  '651': { tz: 'America/Chicago', state: 'MN' },
  '763': { tz: 'America/Chicago', state: 'MN' },
  '952': { tz: 'America/Chicago', state: 'MN' },
  // Mississippi
  '228': { tz: 'America/Chicago', state: 'MS' },
  '601': { tz: 'America/Chicago', state: 'MS' },
  '662': { tz: 'America/Chicago', state: 'MS' },
  '769': { tz: 'America/Chicago', state: 'MS' },
  // Missouri
  '314': { tz: 'America/Chicago', state: 'MO' },
  '417': { tz: 'America/Chicago', state: 'MO' },
  '573': { tz: 'America/Chicago', state: 'MO' },
  '636': { tz: 'America/Chicago', state: 'MO' },
  '660': { tz: 'America/Chicago', state: 'MO' },
  '816': { tz: 'America/Chicago', state: 'MO' },
  // Nebraska
  '308': { tz: 'America/Chicago', state: 'NE' },
  '402': { tz: 'America/Chicago', state: 'NE' },
  '531': { tz: 'America/Chicago', state: 'NE' },
  // North Dakota
  '701': { tz: 'America/Chicago', state: 'ND' },
  // Oklahoma
  '405': { tz: 'America/Chicago', state: 'OK' },
  '539': { tz: 'America/Chicago', state: 'OK' },
  '580': { tz: 'America/Chicago', state: 'OK' },
  '918': { tz: 'America/Chicago', state: 'OK' },
  // South Dakota
  '605': { tz: 'America/Chicago', state: 'SD' },
  // Tennessee (central/western)
  '615': { tz: 'America/Chicago', state: 'TN' },
  '629': { tz: 'America/Chicago', state: 'TN' },
  '731': { tz: 'America/Chicago', state: 'TN' },
  '901': { tz: 'America/Chicago', state: 'TN' },
  // Texas (most)
  '210': { tz: 'America/Chicago', state: 'TX' },
  '214': { tz: 'America/Chicago', state: 'TX' },
  '254': { tz: 'America/Chicago', state: 'TX' },
  '281': { tz: 'America/Chicago', state: 'TX' },
  '325': { tz: 'America/Chicago', state: 'TX' },
  '346': { tz: 'America/Chicago', state: 'TX' },
  '361': { tz: 'America/Chicago', state: 'TX' },
  '409': { tz: 'America/Chicago', state: 'TX' },
  '430': { tz: 'America/Chicago', state: 'TX' },
  '469': { tz: 'America/Chicago', state: 'TX' },
  '512': { tz: 'America/Chicago', state: 'TX' },
  '682': { tz: 'America/Chicago', state: 'TX' },
  '713': { tz: 'America/Chicago', state: 'TX' },
  '726': { tz: 'America/Chicago', state: 'TX' },
  '737': { tz: 'America/Chicago', state: 'TX' },
  '806': { tz: 'America/Chicago', state: 'TX' },
  '817': { tz: 'America/Chicago', state: 'TX' },
  '830': { tz: 'America/Chicago', state: 'TX' },
  '832': { tz: 'America/Chicago', state: 'TX' },
  '903': { tz: 'America/Chicago', state: 'TX' },
  '936': { tz: 'America/Chicago', state: 'TX' },
  '940': { tz: 'America/Chicago', state: 'TX' },
  '956': { tz: 'America/Chicago', state: 'TX' },
  '972': { tz: 'America/Chicago', state: 'TX' },
  '979': { tz: 'America/Chicago', state: 'TX' },
  // Wisconsin
  '262': { tz: 'America/Chicago', state: 'WI' },
  '414': { tz: 'America/Chicago', state: 'WI' },
  '534': { tz: 'America/Chicago', state: 'WI' },
  '608': { tz: 'America/Chicago', state: 'WI' },
  '715': { tz: 'America/Chicago', state: 'WI' },
  '920': { tz: 'America/Chicago', state: 'WI' },

  // ── MOUNTAIN (America/Denver) ──────────────────────────────────────────────
  // Arizona (no DST — America/Phoenix)
  '480': { tz: 'America/Phoenix', state: 'AZ' },
  '520': { tz: 'America/Phoenix', state: 'AZ' },
  '602': { tz: 'America/Phoenix', state: 'AZ' },
  '623': { tz: 'America/Phoenix', state: 'AZ' },
  '928': { tz: 'America/Phoenix', state: 'AZ' },
  // Colorado
  '303': { tz: 'America/Denver', state: 'CO' },
  '719': { tz: 'America/Denver', state: 'CO' },
  '720': { tz: 'America/Denver', state: 'CO' },
  '970': { tz: 'America/Denver', state: 'CO' },
  // Idaho
  '208': { tz: 'America/Denver', state: 'ID' },
  '986': { tz: 'America/Denver', state: 'ID' },
  // Montana
  '406': { tz: 'America/Denver', state: 'MT' },
  // New Mexico
  '505': { tz: 'America/Denver', state: 'NM' },
  '575': { tz: 'America/Denver', state: 'NM' },
  // Texas (El Paso / west)
  '432': { tz: 'America/Denver', state: 'TX' },
  '915': { tz: 'America/Denver', state: 'TX' },
  // Utah
  '385': { tz: 'America/Denver', state: 'UT' },
  '435': { tz: 'America/Denver', state: 'UT' },
  '801': { tz: 'America/Denver', state: 'UT' },
  // Wyoming
  '307': { tz: 'America/Denver', state: 'WY' },

  // ── PACIFIC (America/Los_Angeles) ─────────────────────────────────────────
  // California
  '209': { tz: 'America/Los_Angeles', state: 'CA' },
  '213': { tz: 'America/Los_Angeles', state: 'CA' },
  '310': { tz: 'America/Los_Angeles', state: 'CA' },
  '323': { tz: 'America/Los_Angeles', state: 'CA' },
  '408': { tz: 'America/Los_Angeles', state: 'CA' },
  '415': { tz: 'America/Los_Angeles', state: 'CA' },
  '424': { tz: 'America/Los_Angeles', state: 'CA' },
  '442': { tz: 'America/Los_Angeles', state: 'CA' },
  '510': { tz: 'America/Los_Angeles', state: 'CA' },
  '530': { tz: 'America/Los_Angeles', state: 'CA' },
  '559': { tz: 'America/Los_Angeles', state: 'CA' },
  '562': { tz: 'America/Los_Angeles', state: 'CA' },
  '619': { tz: 'America/Los_Angeles', state: 'CA' },
  '626': { tz: 'America/Los_Angeles', state: 'CA' },
  '628': { tz: 'America/Los_Angeles', state: 'CA' },
  '650': { tz: 'America/Los_Angeles', state: 'CA' },
  '657': { tz: 'America/Los_Angeles', state: 'CA' },
  '661': { tz: 'America/Los_Angeles', state: 'CA' },
  '669': { tz: 'America/Los_Angeles', state: 'CA' },
  '707': { tz: 'America/Los_Angeles', state: 'CA' },
  '714': { tz: 'America/Los_Angeles', state: 'CA' },
  '747': { tz: 'America/Los_Angeles', state: 'CA' },
  '760': { tz: 'America/Los_Angeles', state: 'CA' },
  '805': { tz: 'America/Los_Angeles', state: 'CA' },
  '818': { tz: 'America/Los_Angeles', state: 'CA' },
  '831': { tz: 'America/Los_Angeles', state: 'CA' },
  '858': { tz: 'America/Los_Angeles', state: 'CA' },
  '909': { tz: 'America/Los_Angeles', state: 'CA' },
  '916': { tz: 'America/Los_Angeles', state: 'CA' },
  '925': { tz: 'America/Los_Angeles', state: 'CA' },
  '949': { tz: 'America/Los_Angeles', state: 'CA' },
  '951': { tz: 'America/Los_Angeles', state: 'CA' },
  // Nevada
  '702': { tz: 'America/Los_Angeles', state: 'NV' },
  '725': { tz: 'America/Los_Angeles', state: 'NV' },
  '775': { tz: 'America/Los_Angeles', state: 'NV' },
  // Oregon
  '458': { tz: 'America/Los_Angeles', state: 'OR' },
  '503': { tz: 'America/Los_Angeles', state: 'OR' },
  '541': { tz: 'America/Los_Angeles', state: 'OR' },
  '971': { tz: 'America/Los_Angeles', state: 'OR' },
  // Washington
  '206': { tz: 'America/Los_Angeles', state: 'WA' },
  '253': { tz: 'America/Los_Angeles', state: 'WA' },
  '360': { tz: 'America/Los_Angeles', state: 'WA' },
  '425': { tz: 'America/Los_Angeles', state: 'WA' },
  '509': { tz: 'America/Los_Angeles', state: 'WA' },
  '564': { tz: 'America/Los_Angeles', state: 'WA' },

  // ── ALASKA ────────────────────────────────────────────────────────────────
  '907': { tz: 'America/Anchorage', state: 'AK' },

  // ── HAWAII ────────────────────────────────────────────────────────────────
  '808': { tz: 'Pacific/Honolulu', state: 'HI' },

  // ── PUERTO RICO ───────────────────────────────────────────────────────────
  '787': { tz: 'America/Puerto_Rico', state: 'PR' },
  '939': { tz: 'America/Puerto_Rico', state: 'PR' },
};

export interface LocalTimeResult {
  time: string;       // "10:15 AM"
  hour: number;       // 0-23 (fractional for safety calcs)
  timezone: string;   // IANA: "America/New_York"
  stateAbbr: string;  // "NY"
  isUnsafe: boolean;  // TCPA: hour < 8 || hour >= 21
  isCaution: boolean; // Near boundary: hour < 8.5 || hour >= 20
  hasData: boolean;   // false if area code not in map (international / unknown)
}

/**
 * Extract US area code from an E.164 phone number.
 * Returns null if the number is not US (+1...) or has no recognizable area code.
 */
export function extractAreaCode(phone: string): string | null {
  if (!phone) return null;
  // E.164 US: +1XXXXXXXXXX
  const match = phone.replace(/\D/g, '').match(/^1(\d{3})/);
  return match ? match[1] : null;
}

/**
 * Look up timezone info for a US phone number.
 * Returns null if the number is non-US or area code unknown.
 */
export function getAreaInfo(phone: string): AreaInfo | null {
  const code = extractAreaCode(phone);
  if (!code) return null;
  return AREA_CODE_MAP[code] ?? null;
}

/**
 * Get the local time for a given US phone number right now.
 * Uses Intl.DateTimeFormat — no external API, works in browser and Node.
 */
export function getLocalTime(phone: string): LocalTimeResult {
  const info = getAreaInfo(phone);

  if (!info) {
    return {
      time: '',
      hour: 12,
      timezone: '',
      stateAbbr: '',
      isUnsafe: false,
      isCaution: false,
      hasData: false,
    };
  }

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: info.tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const hourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: info.tz,
    hour: 'numeric',
    hour12: false,
  });

  const time = formatter.format(now);
  const hourStr = hourFormatter.format(now);
  const hour = parseInt(hourStr, 10);

  return {
    time,
    hour,
    timezone: info.tz,
    stateAbbr: info.state,
    isUnsafe: hour < 8 || hour >= 21,   // TCPA: before 8am or after 9pm
    isCaution: hour < 9 || hour >= 20,  // caution zone: before 9am or after 8pm
    hasData: true,
  };
}
