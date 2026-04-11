import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  active: boolean;
}

const bars = [20, 38, 26, 44, 30, 50];

export default function AudioVisualizer({ active }: AudioVisualizerProps) {
  return (
    <div className="flex items-end justify-center gap-2 rounded-[32px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_0_30px_rgba(0,255,102,0.08)]">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          animate={{ height: active ? [height, 12, height + 18] : [height, height] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: index * 0.08 }}
          className="w-2 rounded-full bg-emerald-400"
          style={{ minHeight: 12 }}
        />
      ))}
    </div>
  );
}
