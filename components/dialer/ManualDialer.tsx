import { motion } from 'framer-motion';
import { ChevronDown, Phone } from 'lucide-react';
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

const countryOptions = ['+1', '+44', '+92', '+91'];

export default function ManualDialer({ countryCode, phoneNumber, onCountryChange, onPhoneChange, onDial, onDigit, onBackspace, isReady }: ManualDialerProps) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_30px_rgba(0,255,102,0.06)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Manual dial</p>
          <h2 className="text-xl font-semibold text-white">Type or tap to dial</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isReady ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
          {isReady ? 'Live ready' : 'Offline'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-900/90 p-4">
          <label className="relative flex items-center rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-slate-300">
            <select
              value={countryCode}
              onChange={(event) => onCountryChange(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none"
            >
              {countryOptions.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 h-4 w-4 text-slate-400" />
          </label>

          <label className="flex-1">
            <span className="sr-only">Phone number</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder="Enter phone number"
              className="w-full rounded-3xl border border-transparent bg-slate-950/90 px-4 py-3 text-lg text-white outline-none transition focus:border-emerald-400/30 focus:ring-emerald-400/20"
            />
          </label>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <button
            type="button"
            onClick={onBackspace}
            className="rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-slate-300 transition hover:border-emerald-400/30 hover:bg-slate-800"
          >
            Backspace
          </button>
          <button
            type="button"
            onClick={() => onDigit('+')}
            className="rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-slate-300 transition hover:border-emerald-400/30 hover:bg-slate-800"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onDigit('0')}
            className="rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-slate-300 transition hover:border-emerald-400/30 hover:bg-slate-800"
          >
            0
          </button>
          <button
            type="button"
            onClick={onDial}
            className="inline-flex items-center justify-center rounded-3xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(0,255,102,0.25)] transition hover:bg-emerald-400"
          >
            <Phone className="mr-2 h-4 w-4" /> Dial
          </button>
        </div>

        <Keypad onPress={onDigit} />
      </div>
    </div>
  );
}
