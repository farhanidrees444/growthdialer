'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, PhoneCall, ChevronDown, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { parsePhoneNumberFromString, getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';
import { createClient } from '@/lib/supabase/client';

const KEYS = [
  { digit: '1', sub: '' },      { digit: '2', sub: 'ABC' }, { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },   { digit: '5', sub: 'JKL' }, { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },  { digit: '8', sub: 'TUV' }, { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },       { digit: '0', sub: '+' },   { digit: '#', sub: '' },
];

// Common countries shown first in the dropdown
const PRIORITY_COUNTRIES: CountryCode[] = ['US', 'GB', 'CA', 'AU', 'IN', 'PK', 'NG', 'ZA', 'AE', 'SG'];

function countryFlag(code: CountryCode): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');
}

interface CountryOption {
  code: CountryCode;
  dialCode: string;
  flag: string;
  label: string;
}

function buildCountryOption(code: CountryCode): CountryOption {
  return {
    code,
    dialCode: `+${getCountryCallingCode(code)}`,
    flag: countryFlag(code),
    label: new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code,
  };
}

// Derive country code from a purchased E.164 number (e.g. "+1XXXXXXXXXX" → 'US')
function countryFromE164(e164: string): CountryCode {
  try {
    const parsed = parsePhoneNumberFromString(e164);
    return (parsed?.country ?? 'US') as CountryCode;
  } catch {
    return 'US';
  }
}

function formatDisplay(raw: string, dialCode: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // Format with libphonenumber using the dialCode to get country
  try {
    const countryCode = dialCode.replace('+', '');
    const parsed = parsePhoneNumberFromString(`+${countryCode}${digits}`);
    if (parsed) return parsed.formatNational();
  } catch { /* */ }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function validatePhone(raw: string, country: CountryCode): { valid: boolean; label: string; color: string } {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return { valid: false, label: '', color: '' };
  try {
    const dialCode = getCountryCallingCode(country);
    const parsed = parsePhoneNumberFromString(`+${dialCode}${digits}`, country);
    if (parsed?.isValid()) {
      const type = parsed.getType();
      const typeLabel = type === 'MOBILE' ? 'mobile' : type === 'FIXED_LINE' ? 'landline' : 'number';
      return { valid: true, label: `✓ Valid ${typeLabel}`, color: 'text-green-400' };
    }
  } catch { /* */ }
  if (digits.length < 6) return { valid: false, label: '⚠ Keep typing...', color: 'text-white/40' };
  return { valid: false, label: '⚠ Invalid format', color: 'text-yellow-400' };
}

interface ManualDialpadOverlayProps {
  open: boolean;
  onClose: () => void;
  onDial: (phone: string) => void;
}

export function ManualDialpadOverlay({ open, onClose, onDial }: ManualDialpadOverlayProps) {
  const [raw, setRaw] = useState('');
  const [country, setCountry] = useState<CountryCode>('US');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [noPurchasedNumbers, setNoPurchasedNumbers] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);

  const inputRef = useRef<HTMLDivElement>(null);

  // Load recents from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('dialer-recents') ?? '[]') as string[];
      setRecents(stored);
    } catch { /* */ }
  }, []);

  // Detect user's primary country from purchased numbers
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    (async () => {
      try {
        const { data } = await supabase
          .from('purchased_numbers')
          .select('phone_number, is_default')
          .order('is_default', { ascending: false })
          .limit(10);
        if (!data || data.length === 0) {
          setNoPurchasedNumbers(true);
          return;
        }
        setNoPurchasedNumbers(false);
        const defaultNum = data.find((n) => n.is_default) ?? data[0];
        if (defaultNum?.phone_number) {
          setCountry(countryFromE164(defaultNum.phone_number));
        }
      } catch { /* silently use US default */ }
    })();
  }, [open]);

  const selectedOption = buildCountryOption(country);

  const allCountries: CountryOption[] = [
    ...PRIORITY_COUNTRIES.map(buildCountryOption),
    ...getCountries()
      .filter((c) => !PRIORITY_COUNTRIES.includes(c))
      .map(buildCountryOption)
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];

  const press = useCallback((digit: string) => {
    setRaw((prev) => prev.length < 15 ? prev + digit : prev);
  }, []);

  const backspace = useCallback(() => {
    setRaw((prev) => prev.slice(0, -1));
  }, []);

  const dial = useCallback(() => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;
    const dialCode = getCountryCallingCode(country);
    const e164 = `+${dialCode}${digits}`;

    // Validate before dialing
    try {
      const parsed = parsePhoneNumberFromString(e164, country);
      if (!parsed?.isValid()) return;
    } catch { return; }

    // Save to recents
    try {
      const updated = [e164, ...recents.filter((r) => r !== e164)].slice(0, 5);
      setRecents(updated);
      localStorage.setItem('dialer-recents', JSON.stringify(updated));
    } catch { /* */ }

    onDial(e164);
    setRaw('');
    onClose();
  }, [raw, country, recents, onDial, onClose]);

  const validation = validatePhone(raw, country);
  const formatted = formatDisplay(raw, selectedOption.dialCode);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-[380px] bg-zinc-950 border-l border-white/[0.08]"
            style={{ backdropFilter: 'blur(24px)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <span className="text-sm font-medium text-white">Manual Dial</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {noPurchasedNumbers ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="text-4xl">📞</div>
                <p className="text-sm text-white/60">You need a phone number to make calls.</p>
                <a
                  href="/numbers"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}
                >
                  Buy a Number
                </a>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-y-auto px-5 py-4">
                {/* Country selector */}
                <div className="relative mb-4">
                  <button
                    onClick={() => setCountryPickerOpen((p) => !p)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] transition-colors text-left"
                    aria-label="Select country"
                  >
                    <span className="text-lg leading-none">{selectedOption.flag}</span>
                    <span className="text-sm text-white/80 flex-1">{selectedOption.label}</span>
                    <span className="text-sm text-white/40 tabular-nums">{selectedOption.dialCode}</span>
                    <ChevronDownIcon className="w-3.5 h-3.5 text-white/30" />
                  </button>

                  <AnimatePresence>
                    {countryPickerOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg bg-zinc-900 border border-white/[0.08] shadow-2xl scrollbar-hide"
                      >
                        {allCountries.map((opt) => (
                          <button
                            key={opt.code}
                            onClick={() => { setCountry(opt.code); setCountryPickerOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors text-left ${opt.code === country ? 'bg-white/[0.05]' : ''}`}
                          >
                            <span className="text-base leading-none">{opt.flag}</span>
                            <span className="flex-1 text-white/80 truncate">{opt.label}</span>
                            <span className="text-white/30 tabular-nums text-xs">{opt.dialCode}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Phone display */}
                <div ref={inputRef} className="text-center mb-1">
                  <div className="text-3xl font-light tabular-nums text-white tracking-widest min-h-[44px] flex items-center justify-center gap-1">
                    <span className="text-white/30 text-xl">{selectedOption.dialCode}</span>
                    {formatted
                      ? <span>{formatted}</span>
                      : <span className="text-white/20 text-xl">—</span>
                    }
                  </div>
                  {validation.label && (
                    <div className={`text-xs mt-1 ${validation.color}`}>{validation.label}</div>
                  )}
                </div>

                {/* Backspace */}
                <div className="flex justify-end mb-3">
                  <button
                    onClick={backspace}
                    disabled={!raw}
                    className="p-2 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                    aria-label="Backspace"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {KEYS.map(({ digit, sub }) => (
                    <motion.button
                      key={digit}
                      onClick={() => press(digit)}
                      whileTap={{ scale: 0.93 }}
                      className="aspect-square rounded-2xl flex flex-col items-center justify-center bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.09] hover:border-white/[0.14] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                      aria-label={digit}
                    >
                      <span className="text-2xl font-light text-white leading-none">{digit}</span>
                      {sub && <span className="text-[9px] text-white/30 mt-0.5">{sub}</span>}
                    </motion.button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={() => setRaw('')}
                    className="flex-1 h-10 rounded-lg text-sm text-white/50 hover:text-white bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                  >
                    Clear
                  </button>
                  <motion.button
                    onClick={dial}
                    disabled={!validation.valid}
                    whileHover={validation.valid ? { scale: 1.02 } : {}}
                    whileTap={validation.valid ? { scale: 0.98 } : {}}
                    className="flex-[2] h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                  >
                    <PhoneCall className="w-4 h-4" />
                    Call
                  </motion.button>
                </div>

                {/* Recents */}
                {recents.length > 0 && (
                  <div>
                    <button
                      onClick={() => setRecentOpen((p) => !p)}
                      className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors mb-2"
                    >
                      {recentOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      Recent dials
                    </button>
                    <AnimatePresence>
                      {recentOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-1"
                        >
                          {recents.map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                // Strip dial code prefix to get local digits
                                const dialCode = getCountryCallingCode(country);
                                const stripped = num.startsWith(`+${dialCode}`)
                                  ? num.slice(dialCode.length + 1)
                                  : num.replace(/^\+\d{1,3}/, '');
                                setRaw(stripped);
                              }}
                              className="w-full text-left text-sm text-white/60 hover:text-white px-2 py-1.5 rounded hover:bg-white/[0.05] transition-colors font-mono tabular-nums"
                            >
                              {num}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
