'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PhoneCall, ChevronDown, Search, ClipboardPaste, Trash2, Delete } from 'lucide-react';
import { parsePhoneNumberFromString, getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';
import * as Flags from 'country-flag-icons/react/3x2';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

// ── Dialpad key layout ─────────────────────────────────────────────────────────
const KEYS = [
  { digit: '1', sub: '' },     { digit: '2', sub: 'ABC' }, { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },  { digit: '5', sub: 'JKL' }, { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' }, { digit: '8', sub: 'TUV' }, { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },      { digit: '0', sub: '+' },   { digit: '#', sub: '' },
];

// Priority countries shown at top of dropdown
const PRIORITY: CountryCode[] = ['US', 'GB', 'CA', 'AU', 'IN', 'PK', 'NG', 'ZA', 'AE', 'SG'];

// ── Flag component (real SVG via country-flag-icons) ──────────────────────────
type FlagComponent = React.ComponentType<{ className?: string; title?: string }>;

function FlagIcon({ code, className = 'w-6 h-4' }: { code: string; className?: string }) {
  const Flag = (Flags as Record<string, FlagComponent>)[code];
  if (!Flag) {
    return (
      <span
        className={`${className} inline-flex items-center justify-center rounded-[2px] bg-white/10 text-[10px] text-white/40`}
      >
        {code}
      </span>
    );
  }
  return <Flag className={`${className} rounded-[2px]`} title={code} />;
}

// ── Country helpers ────────────────────────────────────────────────────────────
const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

interface CountryOption {
  code: CountryCode;
  dialCode: string;
  label: string;
}

function buildOption(code: CountryCode): CountryOption {
  return {
    code,
    dialCode: `+${getCountryCallingCode(code)}`,
    label: displayNames.of(code) ?? code,
  };
}

function countryFromE164(e164: string): CountryCode {
  try {
    const p = parsePhoneNumberFromString(e164);
    return (p?.country ?? 'US') as CountryCode;
  } catch { return 'US'; }
}

function formatDisplay(raw: string, country: CountryCode): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  try {
    const dialCode = getCountryCallingCode(country);
    const p = parsePhoneNumberFromString(`+${dialCode}${digits}`, country);
    if (p) return p.formatNational();
  } catch { /* */ }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function validatePhone(raw: string, country: CountryCode) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return { valid: false, label: '', color: '' };
  try {
    const dialCode = getCountryCallingCode(country);
    const p = parsePhoneNumberFromString(`+${dialCode}${digits}`, country);
    if (p?.isValid()) {
      const t = p.getType();
      const tLabel = t === 'MOBILE' ? 'mobile' : t === 'FIXED_LINE' ? 'landline' : 'number';
      const countryLabel = displayNames.of(country) ?? country;
      return { valid: true, label: `✓ Valid ${countryLabel} ${tLabel}`, color: 'text-emerald-400' };
    }
  } catch { /* */ }
  if (digits.length < 6) return { valid: false, label: 'Keep typing…', color: 'text-white/25' };
  return { valid: false, label: '⚠ Invalid format', color: 'text-yellow-400' };
}

// ── Component ──────────────────────────────────────────────────────────────────
interface ManualDialpadOverlayProps {
  open: boolean;
  onClose: () => void;
  onDial: (phone: string) => void;
}

export function ManualDialpadOverlay({ open, onClose, onDial }: ManualDialpadOverlayProps) {
  const [raw, setRaw] = useState('');
  const [country, setCountry] = useState<CountryCode>('US');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [noPurchasedNumbers, setNoPurchasedNumbers] = useState(false);
  const [isDialing, setIsDialing] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const backspaceLongPressRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Load recents ────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('dialer-recents') ?? '[]') as string[];
      setRecents(s);
    } catch { /* */ }
  }, []);

  // ── Detect user's country from purchased numbers ────────────────────────────
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
        if (!data || data.length === 0) { setNoPurchasedNumbers(true); return; }
        setNoPurchasedNumbers(false);
        const def = data.find((n) => n.is_default) ?? data[0];
        if (def?.phone_number) setCountry(countryFromE164(def.phone_number));
      } catch { /* fallback US */ }
    })();
  }, [open]);

  // ── Reset on open ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setPickerOpen(false);
      setSearch('');
      setIsDialing(false);
      // Focus the overlay so keyboard events are captured
      setTimeout(() => overlayRef.current?.focus(), 60);
    }
  }, [open]);

  // ── Keyboard input ──────────────────────────────────────────────────────────
  const press = useCallback((digit: string) => {
    setRaw((prev) => (prev.length < 15 ? prev + digit : prev));
  }, []);

  const backspace = useCallback(() => {
    setRaw((prev) => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Allow typing in the country search input
      if (target === searchRef.current) return;
      // Don't capture other inputs
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ('0123456789'.includes(e.key)) { e.preventDefault(); press(e.key); return; }
      if (e.key === '*' || e.key === '#') { e.preventDefault(); press(e.key); return; }
      if (e.key === '+') { e.preventDefault(); press('+'); return; }
      if (e.key === 'Backspace') { e.preventDefault(); backspace(); return; }
      if (e.key === 'Escape') { onClose(); return; }
    };

    // Small delay so Enter from confirm modal doesn't immediately dial
    const timer = setTimeout(() => {
      window.addEventListener('keydown', handler);
    }, 200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handler);
    };
  }, [open, press, backspace, onClose]);

  // Separate Enter listener (needs validation state)
  const validRef = useRef(false);
  const dialRef = useRef<() => void>(() => {});

  // ── Dial ────────────────────────────────────────────────────────────────────
  const dial = useCallback(() => {
    const digits = raw.replace(/\D/g, '');
    if (!digits || isDialing) return;
    const dialCode = getCountryCallingCode(country);
    const e164 = `+${dialCode}${digits}`;
    try {
      const p = parsePhoneNumberFromString(e164, country);
      if (!p?.isValid()) return;
    } catch { return; }

    setIsDialing(true);
    try {
      const updated = [e164, ...recents.filter((r) => r !== e164)].slice(0, 5);
      setRecents(updated);
      localStorage.setItem('dialer-recents', JSON.stringify(updated));
    } catch { /* */ }

    onDial(e164);
    setRaw('');
    onClose();
  }, [raw, country, recents, onDial, onClose, isDialing]);

  // Store dial in ref for the Enter keydown listener
  dialRef.current = dial;

  const validation = validatePhone(raw, country);
  validRef.current = validation.valid;

  // Enter key listener (separate to see latest validation state)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target === searchRef.current || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter' && validRef.current) {
        e.preventDefault();
        dialRef.current();
      }
    };
    const timer = setTimeout(() => window.addEventListener('keydown', handler), 200);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handler); };
  }, [open]);

  // ── Paste ───────────────────────────────────────────────────────────────────
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const p = parsePhoneNumberFromString(text.trim());
      if (p && p.isValid()) {
        const cc = p.country as CountryCode | undefined;
        if (cc) setCountry(cc);
        setRaw(p.nationalNumber as string);
      } else {
        const digits = text.replace(/\D/g, '');
        if (digits.length >= 7) {
          setRaw(digits);
        } else {
          toast.error('No valid phone number found in clipboard');
        }
      }
    } catch {
      toast.error('Could not read clipboard');
    }
  };

  // ── Backspace long-press (clear all) ────────────────────────────────────────
  const onBackspaceDown = () => {
    backspace();
    backspaceLongPressRef.current = setTimeout(() => {
      setRaw('');
    }, 500);
  };

  const onBackspaceUp = () => {
    clearTimeout(backspaceLongPressRef.current);
  };

  // ── Country list ────────────────────────────────────────────────────────────
  const allCountries: CountryOption[] = [
    ...PRIORITY.map(buildOption),
    ...getCountries()
      .filter((c) => !PRIORITY.includes(c))
      .map(buildOption)
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];

  const filteredCountries = search
    ? allCountries.filter((c) =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.dialCode.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase()),
      )
    : allCountries;

  const selected = buildOption(country);
  const formatted = formatDisplay(raw, country);
  const displayText = formatted || '';
  const dialCode = selected.dialCode;

  // What the Call button shows
  const callLabel = validation.valid
    ? `${dialCode} ${formatted}`
    : raw ? 'Invalid number' : 'Enter a number';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={overlayRef}
            tabIndex={-1}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-[400px] bg-zinc-950 border-l border-white/[0.08] outline-none"
            style={{ boxShadow: '-8px 0 48px rgba(0,0,0,0.6)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
              <span className="text-sm font-semibold text-white tracking-wide">Manual Dial</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.07] transition-colors"
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
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}
                >
                  Buy a Number
                </a>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-y-auto px-5 py-4 gap-4">

                {/* ── Country selector ───────────────────────────────────── */}
                <div className="relative">
                  <button
                    onClick={() => { setPickerOpen((p) => !p); setSearch(''); }}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.14] transition-all text-left"
                    aria-label="Select country"
                  >
                    <FlagIcon code={selected.code} className="w-6 h-[18px] flex-shrink-0 rounded-[2px]" />
                    <span className="flex-1 text-sm text-white/80 font-medium">{selected.label}</span>
                    <span className="text-sm text-white/40 tabular-nums font-mono">{selected.dialCode}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-white/30 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {pickerOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.14 }}
                        className="absolute top-full left-0 right-0 z-20 mt-1.5 rounded-xl bg-zinc-900 border border-white/[0.08] shadow-2xl overflow-hidden"
                        style={{ maxHeight: 240 }}
                      >
                        {/* Search */}
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
                          <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                          <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search country or code…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                            autoComplete="off"
                          />
                        </div>

                        {/* Country list */}
                        <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: 196 }}>
                          {filteredCountries.length === 0 && (
                            <div className="px-3 py-4 text-sm text-white/30 text-center">No matches</div>
                          )}
                          {filteredCountries.map((opt) => (
                            <button
                              key={opt.code}
                              onClick={() => { setCountry(opt.code); setPickerOpen(false); setSearch(''); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-white/[0.06] transition-colors text-left ${
                                opt.code === country ? 'bg-cyan-500/10' : ''
                              }`}
                            >
                              <FlagIcon code={opt.code} className="w-5 h-[15px] flex-shrink-0 rounded-[2px]" />
                              <span className="flex-1 text-white/80 truncate">{opt.label}</span>
                              <span className="text-white/30 tabular-nums text-xs font-mono">{opt.dialCode}</span>
                              {opt.code === country && (
                                <span className="text-cyan-400 text-xs font-bold">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Phone input display ─────────────────────────────────── */}
                <div
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 focus-within:border-cyan-500/40 focus-within:bg-white/[0.05] transition-all"
                  style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono text-white/35 flex-shrink-0 tabular-nums">
                      {dialCode}
                    </span>
                    <div className="flex-1 min-w-0">
                      {displayText ? (
                        <span className="text-2xl font-light text-white tabular-nums tracking-wider">
                          {displayText}
                        </span>
                      ) : (
                        <span className="text-2xl font-light text-white/15 tabular-nums tracking-wider select-none">
                          555 123 4567
                        </span>
                      )}
                    </div>
                    {/* Backspace — long-press clears all */}
                    <motion.button
                      onMouseDown={onBackspaceDown}
                      onMouseUp={onBackspaceUp}
                      onMouseLeave={onBackspaceUp}
                      onTouchStart={onBackspaceDown}
                      onTouchEnd={onBackspaceUp}
                      disabled={!raw}
                      whileTap={{ scale: 0.88 }}
                      className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.07] disabled:opacity-20 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                      aria-label="Backspace (long-press to clear)"
                    >
                      <Delete className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                    </motion.button>
                  </div>

                  {/* Validation hint */}
                  {validation.label && (
                    <motion.p
                      key={validation.label}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-xs mt-1.5 ${validation.color}`}
                    >
                      {validation.label}
                    </motion.p>
                  )}
                </div>

                {/* ── Paste + Clear ──────────────────────────────────────── */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePaste}
                    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] transition-all"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    Paste
                  </button>
                  <button
                    onClick={() => setRaw('')}
                    disabled={!raw}
                    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>

                {/* ── Dialpad ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-2">
                  {KEYS.map(({ digit, sub }) => (
                    <motion.button
                      key={digit}
                      onClick={() => press(digit)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.93, backgroundColor: 'rgba(255,255,255,0.12)' }}
                      className="relative rounded-2xl flex flex-col items-center justify-center py-4 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                        border: '1px solid rgba(255,255,255,0.08)',
                        minHeight: 64,
                      }}
                      aria-label={digit}
                    >
                      <span className="text-[26px] font-light text-white leading-none tabular-nums">{digit}</span>
                      {sub && (
                        <span className="text-[9px] uppercase tracking-widest text-white/30 mt-1 leading-none">
                          {sub}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* ── Call button ─────────────────────────────────────────── */}
                <motion.button
                  onClick={dial}
                  disabled={!validation.valid || isDialing}
                  whileHover={validation.valid ? { scale: 1.02, boxShadow: '0 0 28px rgba(22,163,74,0.45)' } : {}}
                  whileTap={validation.valid ? { scale: 0.97 } : {}}
                  className="h-14 rounded-2xl flex items-center justify-center gap-2.5 text-base font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                  aria-label={`Call ${callLabel}`}
                >
                  <PhoneCall className="w-5 h-5" />
                  <span className="tabular-nums">
                    {validation.valid ? `Call ${callLabel}` : 'Enter a valid number'}
                  </span>
                </motion.button>

                {/* ── Recent dials ─────────────────────────────────────────── */}
                {recents.length > 0 && (
                  <div className="pb-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px flex-1 bg-white/[0.06]" />
                      <span className="text-[11px] text-white/25 uppercase tracking-widest">Recent</span>
                      <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                    <div className="space-y-1">
                      {recents.map((num) => {
                        const cc = countryFromE164(num);
                        const opt = buildOption(cc);
                        let displayNum = num;
                        try {
                          const p = parsePhoneNumberFromString(num);
                          if (p) displayNum = p.formatInternational();
                        } catch { /* */ }

                        return (
                          <button
                            key={num}
                            onClick={() => {
                              const dialCodeNum = getCountryCallingCode(cc);
                              const stripped = num.startsWith(`+${dialCodeNum}`)
                                ? num.slice(String(dialCodeNum).length + 1)
                                : num.replace(/^\+\d{1,4}/, '');
                              setCountry(cc);
                              setRaw(stripped);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                          >
                            <FlagIcon code={cc} className="w-5 h-[15px] flex-shrink-0 rounded-[2px]" />
                            <span className="flex-1 text-left font-mono tabular-nums">{displayNum}</span>
                            <span className="text-white/20 text-xs">{opt.dialCode}</span>
                          </button>
                        );
                      })}
                    </div>
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
