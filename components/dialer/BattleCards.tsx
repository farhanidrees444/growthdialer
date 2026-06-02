import { motion } from 'framer-motion';
import { MessageSquare, ShieldCheck, TrendingUp } from 'lucide-react';

interface BattleCard {
  title: string;
  response: string;
  variant: 'danger' | 'info' | 'strategy';
}

const battlecards: BattleCard[] = [
  {
    title: 'We already have a solution',
    response: 'Ask what they like about the current tool, then highlight GrowthDialer’s autonomous follow-up and speed.',
    variant: 'strategy',
  },
  {
    title: 'Send me an email',
    response: 'Confirm the email, then qualify urgency by asking when they need a decision.',
    variant: 'info',
  },
  {
    title: 'No budget',
    response: 'Position GrowthDialer as a revenue engine, not a cost, with fast ROI and reduced manual hours.',
    variant: 'danger',
  },
];

export default function BattleCards() {
  return (
    <div className="space-y-4">
      {battlecards.map((card) => (
        <motion.div key={card.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-950/90 p-5 shadow-[0_0_25px_rgba(0,255,102,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{card.title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.32em] text-slate-500">Suggested response</p>
            </div>
            <div className="rounded-full bg-slate-900/80 px-2 py-1 text-xs text-slate-400">
              {card.variant}
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">{card.response}</p>
        </motion.div>
      ))}
    </div>
  );
}
