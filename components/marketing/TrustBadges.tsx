import { motion } from "framer-motion";
import { Shield, Clock, CheckCircle, CreditCard } from "lucide-react";

const badges = [
  {
    icon: Shield,
    text: "SOC 2 Compliant",
    color: "text-green-400",
  },
  {
    icon: CheckCircle,
    text: "GDPR Ready",
    color: "text-blue-400",
  },
  {
    icon: Clock,
    text: "99.9% Uptime",
    color: "text-purple-400",
  },
  {
    icon: CreditCard,
    text: "No credit card required",
    color: "text-amber-400",
  },
  {
    icon: CheckCircle,
    text: "Cancel anytime",
    color: "text-emerald-400",
  },
];

export default function TrustBadges() {
  return (
    <section className="py-8 border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-8 lg:gap-12"
        >
          {badges.map((badge, index) => (
            <motion.div
              key={badge.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <badge.icon className={`w-4 h-4 ${badge.color}`} />
              <span>{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}