'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, PhoneCall, ChevronDown, ChevronUp } from 'lucide-react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const KEYS = [
  { digit: '1', sub: '' },     { digit: '2', sub: 'ABC' }, { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' }, { digit: '5', sub: 'JKL' }, { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },{ digit: '8', sub: 'TUV' }, { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },     { digit: '0', sub: '+' },   { digit: '#', sub: '' },
];

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

function validatePhone(raw: string): { valid: boolean; label: string; color: string } {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return { valid: false, label: '', color: '' };
  try {
    const num = parsePhoneNumberFromString('+1' + digits);
    if (num && num.isValid()) return { valid: true, label: '✓ Valid US number', color: 'text-green-400' };
  } catch { /* */ }
  if (digits.length < 7) return { valid: false, label: '⚠ Keep typing...', color: 'text-white/40' };
  return { valid: false, label: '⚠ Invalid format', color: 'text-yellow-400' };
}

interface ManualDialpadOverlayProps {
  open: boolean;
  onClose: () => void;
  onDial: (phone: string) => void;
}

export function ManualDialpadOverlay({ open, onClose, onDial }: ManualDialpadOverlayProps) {
  const [raw, setRaw] = useState('');
  const [recentOpen, setRecentOpen] = useState(false);
  const [recents] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('dialer-recents') ?? '[]'); } catch { return []; }
  });

  const inputRef = useRef<HTMLDivElement>(null);

  const press = useCallback((digit: string) => {
    if (digit === '+') {
      setRaw((prev) => (prev ? prev : '+'));
      return;
    }
    setRaw((prev) => prev.length < 15 ? prev + digit : prev);
  }, []);

  const backspace = useCallback(() => {
    setRaw((prev) => prev.slice(0, -1));
  }, []);

  const dial = useCallback(() => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 7) return;
    const phone = '+1' + digits;
    // Save to recents
    try {
      const updated = [phone, ...recents.filter((r) => r !== phone)].slice(0, 5);
      localStorage.setItem('dialer-recents', JSON.stringify(updated));
    } catch { /* */ }
    onDial(phone);
    setRaw('');
    onClose();
  }, [raw, recents, onDial, onClose]);

  const validation = validatePhone(raw);
  const formatted = formatPhone(raw);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Slide-in panel */}
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

            <div className="flex-1 flex flex-col overflow-y-auto px-5 py-4">
              {/* Phone display */}
              <div
                ref={inputRef}
                className="text-center mb-1"
              >
                <div className="text-4xl font-light tabular-nums text-white tracking-widest min-h-[48px] flex items-center justify-center">
                  {formatted || <span className="text-white/20 text-2xl">+1 (—) ———-————</span>}
                </div>
                {validation.label && (
                  <div className={`text-xs mt-1 ${validation.color}`}>{validation.label}</div>
                )}
              </div>

              {/* Backspace */}
              <div className="flex justify-end mb-4">
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

              {/* Actions row */}
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
                            onClick={() => setRaw(num.replace(/^\+1/, ''))}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
