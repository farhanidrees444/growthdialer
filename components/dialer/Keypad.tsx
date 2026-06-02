import { motion } from 'framer-motion';

interface KeypadProps {
  onPress: (digit: string) => void;
  className?: string;
}

const digits = ['1'2'3'4'5'6'7'8'9'*'0'#'];

export default function Keypad({ onPress, className = '' }: KeypadProps) {
  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {digits.map((digit) => (
        <motion.button
          key={digit}
          type="button"
          whileTap={{ scale: 0.93 }}
          className="flex aspect-square min-h-[52px] w-full items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-xl font-semibold text-white transition-colors hover:border-white/[0.14] hover:bg-white/[0.07] active:bg-white/[0.10]"
          onClick={() => onPress(digit)}
        >
          {digit}
        </motion.button>
      ))}
    </div>
  );
}
