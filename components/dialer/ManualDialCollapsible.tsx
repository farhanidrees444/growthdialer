'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, ChevronDown } from 'lucide-react';
import ManualDialer from '@/components/dialer/ManualDialer';

interface ManualDialCollapsibleProps {
  countryCode: string;
  phoneNumber: string;
  onCountryChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onDial: () => void;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  isReady: boolean;
}

export default function ManualDialCollapsible(props: ManualDialCollapsibleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-sm transition hover:bg-white/[0.02]"
      >
        <span className="flex items-center gap-2 text-slate-400 font-medium">
          <Hash className="h-4 w-4 text-slate-500" />
          Dial a different number
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="manual-dial-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <ManualDialer {...props} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
