import { motion } from 'framer-motion';
import { Bell, Mic, MicOff, Pause, Repeat, Record, Edit3, SkipForward, PhoneOff, Zap } from 'lucide-react';

interface CallControlsProps {
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  onMute: () => void;
  onHold: () => void;
  onTransfer: () => void;
  onRecord: () => void;
  onNotes: () => void;
  onNext: () => void;
  onEnd: () => void;
}

export default function CallControls({ isMuted, isOnHold, isRecording, onMute, onHold, onTransfer, onRecord, onNotes, onNext, onEnd }: CallControlsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onMute}
        className={`rounded-3xl border border-white/10 px-4 py-4 text-sm font-semibold transition ${isMuted ? 'bg-rose-500/15 text-rose-300' : 'bg-slate-900/80 text-white hover:border-emerald-400/30'}`}
      >
        <div className="flex items-center justify-center gap-2">
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          {isMuted ? 'Unmute' : 'Mute'}
        </div>
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onHold}
        className={`rounded-3xl border border-white/10 px-4 py-4 text-sm font-semibold transition ${isOnHold ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-900/80 text-white hover:border-emerald-400/30'}`}
      >
        <div className="flex items-center justify-center gap-2">
          <Pause className="h-5 w-5" />
          {isOnHold ? 'Resume' : 'Hold'}
        </div>
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onTransfer}
        className="rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm font-semibold text-white transition hover:border-emerald-400/30"
      >
        <div className="flex items-center justify-center gap-2">
          <Repeat className="h-5 w-5" /> Transfer
        </div>
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onRecord}
        className={`rounded-3xl border border-white/10 px-4 py-4 text-sm font-semibold transition ${isRecording ? 'bg-rose-500/15 text-rose-300' : 'bg-slate-900/80 text-white hover:border-emerald-400/30'}`}
      >
        <div className="flex items-center justify-center gap-2">
          <Record className="h-5 w-5" />
          {isRecording ? 'Recording' : 'Record'}
        </div>
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onNotes}
        className="rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm font-semibold text-white transition hover:border-emerald-400/30"
      >
        <div className="flex items-center justify-center gap-2">
          <Edit3 className="h-5 w-5" /> Notes
        </div>
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        className="rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm font-semibold text-white transition hover:border-emerald-400/30"
      >
        <div className="flex items-center justify-center gap-2">
          <SkipForward className="h-5 w-5" /> Next lead
        </div>
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onEnd}
        className="col-span-full rounded-3xl bg-rose-500 px-6 py-4 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(255,0,64,0.2)] transition hover:bg-rose-400"
      >
        <div className="flex items-center justify-center gap-3">
          <PhoneOff className="h-5 w-5" /> End Call
        </div>
      </motion.button>
    </div>
  );
}
