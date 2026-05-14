import { motion } from 'framer-motion';

interface KeypadProps {
  onPress: (digit: string) => void;
  className?: string;
}

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

export default function Keypad({ onPress, className = '' }: KeypadProps) {
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {digits.map((digit) => (
        <motion.button
          key={digit}
          type="button"
          whileTap={{ scale: 0.95 }}
          className="rounded-3xl border border-white/10 bg-slate-900/90 py-5 text-2xl font-semibold text-white transition hover:border-emerald-400/30 hover:bg-slate-800"
          onClick={() => onPress(digit)}
        >
          {digit}
        </motion.button>
      ))}
    </div>
  );
}
