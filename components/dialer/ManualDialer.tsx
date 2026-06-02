'use client';

import { useRef, useCallback } from 'react';
import { ChevronDown, Phone, Clipboard, Delete } from 'lucide-react';
import Keypad from '@/components/dialer/Keypad';

interface ManualDialerProps {
  countryCode: string;
  phoneNumber: string;
  onCountryChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onDial: () => void;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  isReady: boolean;
}

const COUNTRY_OPTIONS = [
  { code: '+1', label: '+1 (US/CA)' },
  { code: '+44', label: '+44 (UK)' },
  { code: '+91', label: '+91 (IN)' },
  { code: '+92', label: '+92 (PK)' },
  { code: '+61', label: '+61 (AU)' },
  { code: '+49', label: '+49 (DE)' },
];

function formatPhoneDisplay(raw: string, countryCode: string): string {
  const digits = raw.replace(/\D/g');
  if (countryCode !== '+1') return raw;
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export default function ManualDialer({
  countryCode,
  phoneNumber,
  onCountryChange,
  onPhoneChange,
  onDial,
  onDigit,
  onBackspace,
  isReady,
}: ManualDialerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/[^\d]/g').slice(0, 10);
      if (digits) onPhoneChange(digits);
      inputRef.current?.focus();
    } catch {
      /* clipboard permission denied */
    }
  }, [onPhoneChange]);

  const displayValue = formatPhoneDisplay(phoneNumber, countryCode);
  const canDial = phoneNumber.replace(/\D/g').length >= 7;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-emerald-400/70">Manual Dial</p>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            isReady ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-400'
          }`}
        >
          {isReady ? '● Live' : '○ Offline'}
        </span>
      </div>

      {/* Country + Number row */}
      <div className="mb-3 flex gap-2">
        <div className="relative shrink-0">
          <select
            value={countryCode}
            onChange={(e) => onCountryChange(e.target.value)}
            className="appearance-none rounded-xl border border-white/[0.06] bg-white/[0.04] py-3 pl-3 pr-7 text-sm text-white outline-none transition focus:border-emerald-500/30"
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code} className="bg-slate-900">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>

        <input
          ref={inputRef}
          type="tel"
          value={displayValue}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g').slice(0, 10);
            onPhoneChange(raw);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canDial) onDial();
            if (e.key === 'Backspace' && phoneNumber.length > 0) {
              e.preventDefault();
              onBackspace();
            }
          }}
          placeholder="(555) 123-4567"
          className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-lg font-semibold tracking-wider text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500/30"
        />
      </div>

      {/* Action row: Backspace | Paste | Dial */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onBackspace}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:text-white"
        >
          <Delete className="h-4 w-4" />
          Delete
        </button>
        <button
          type="button"
          onClick={handlePaste}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:text-white"
        >
          <Clipboard className="h-4 w-4" />
          Paste
        </button>
        <button
          type="button"
          onClick={onDial}
          disabled={!canDial}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3 font-mono text-xs font-bold uppercase tracking-wider text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.12)] transition-all duration-300 hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:shadow-[0_0_25px_rgba(16,185,129,0.22)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Phone className="h-4 w-4" />
          Dial
        </button>
      </div>

      <Keypad onPress={onDigit} />
    </div>
  );
}
